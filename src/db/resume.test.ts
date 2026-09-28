import "fake-indexeddb/auto"
import {
  createResume,
  getResume,
  getAllResumes,
  queryResumes,
  updateResume,
  deleteResume,
} from "@/db/resume"
import { db, type Resume } from "@/db/db"
import { getValidProcessedEntity, saveProcessedEntity } from "@/db/entityCache"
import { createTag } from "@/db/tag"
import { describe, it, expect, beforeEach } from "vitest"

const delay = (ms = 10) => new Promise((resolve) => setTimeout(resolve, ms))

beforeEach(async () => {
  await db.profiles.clear()
  await db.tags.clear()
  await db.resumes.clear()
  await db.entityCache.clear()
})

describe("Resume Service", () => {
  it("handles resume lifecycle, updates, and timestamps", async () => {
    const id = await createResume("Original", [{ type: "paragraph", title: "Old", text: "Old" }])
    const initial = await getResume(id)

    expect(initial).toBeDefined()
    expect(initial?.createdAt).toEqual(initial?.updatedAt)

    await delay(10)

    await updateResume(id, {
      title: "Updated",
      sections: [{ type: "paragraph", title: "New", text: "New" }],
    })
    const updated = await getResume(id)

    expect(updated?.title).toBe("Updated")
    expect(updated?.createdAt).toEqual(initial?.createdAt) // Unchanged
    expect(updated!.updatedAt.getTime()).toBeGreaterThan(initial!.updatedAt.getTime()) // Bumped

    await deleteResume(id)
    expect(await getResume(id)).toBeUndefined()
  })

  it("returns resumes sorted by latest updatedAt", async () => {
    await createResume("Resume 1", [])
    await delay(10)
    const targetId = await createResume("Resume 2", [])
    await delay(10)
    await createResume("Resume 3", [])
    await delay(10)

    await updateResume(targetId, { title: "Resume 2 (Updated)" })

    const resumes = await getAllResumes()
    expect(resumes.map((r) => r.title)).toEqual(["Resume 2 (Updated)", "Resume 3", "Resume 1"])
  })

  it("persists direct tag IDs and hydrates sorted tags", async () => {
    const remoteId = await createTag({ name: "Remote", colour: "#abc" })
    const backendId = await createTag({ name: "Backend", colour: "#def" })
    await createResume("Remote resume", [], { tagIds: [remoteId] })
    await delay(5)
    await createResume("Backend resume", [], { tagIds: [backendId] })
    await delay(5)
    await createResume("Other resume", [], { tagIds: [remoteId, backendId] })

    const result = await queryResumes({
      query: "resume",
      page: 1,
      perPage: 10,
    })

    expect(result.items.map((resume) => resume.title)).toEqual([
      "Other resume",
      "Backend resume",
      "Remote resume",
    ])
    expect(result.items[0]?.tagIds).toEqual([remoteId, backendId])
    expect(result.items[0]?.tags.map((tag) => tag.name)).toEqual(["Backend", "Remote"])

    const combined = await queryResumes({
      query: "backend",
      page: 1,
      perPage: 10,
    })
    expect(combined.items.map((resume) => resume.title)).toEqual(["Backend resume"])
  })

  it("normalises records without direct tag IDs at the read boundary", async () => {
    await db.resumes.add({
      id: "legacy-resume",
      title: "Existing resume",
      sections: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as Resume)

    const result = await queryResumes({ query: "existing", page: 1, perPage: 10 })

    expect(result.items[0]?.tagIds).toEqual([])
    expect(result.items[0]?.tags).toEqual([])
  })

  it("bumps the entity timestamp and invalidates its PDF cache for tag assignments", async () => {
    const id = await createResume("Resume", [], { tagIds: [] })
    const before = await getResume(id)
    await saveProcessedEntity({
      entityType: "resume",
      entityId: id,
      blob: new Blob(["%PDF-fake"], { type: "application/pdf" }),
      processedAt: new Date(),
    })
    await delay(10)

    await updateResume(id, { tagIds: [3, 3, 0] })
    const after = await getResume(id)

    expect(after?.tagIds).toEqual([3])
    expect(after?.updatedAt.getTime()).toBeGreaterThan(before!.updatedAt.getTime())
    expect(
      await getValidProcessedEntity({
        entityType: "resume",
        entityId: id,
        entityUpdatedAt: after!.updatedAt,
      }),
    ).toBeNull()
  })

  it("returns the effective pagination with its page slice", async () => {
    for (let index = 0; index < 5; index += 1) {
      await createResume(`Resume ${index}`, [])
      await delay(2)
    }

    const result = await queryResumes({ query: "", page: 99, perPage: 2 })

    expect(result.pagination).toMatchObject({
      page: 3,
      perPage: 2,
      totalCount: 5,
      totalPages: 3,
    })
    expect(result.items).toHaveLength(1)
  })
})
