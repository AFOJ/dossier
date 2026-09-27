import "fake-indexeddb/auto"
import {
  createCoverLetter,
  getCoverLetter,
  getAllCoverLetters,
  queryCoverLetters,
  updateCoverLetter,
  deleteCoverLetter,
} from "@/db/coverLetter"
import { db, type CoverLetter } from "@/db/db"
import { getValidProcessedEntity, saveProcessedEntity } from "@/db/entityCache"
import { createTag } from "@/db/tag"
import { describe, it, expect, beforeEach } from "vitest"

const delay = (ms = 10) => new Promise((resolve) => setTimeout(resolve, ms))

beforeEach(async () => {
  await db.profiles.clear()
  await db.tags.clear()
  await db.resumes.clear()
  await db.coverLetters.clear()
  await db.entityCache.clear()
})

describe("CoverLetter Service", () => {
  it("handles cover letter lifecycle, updates, and timestamps", async () => {
    const id = await createCoverLetter({ title: "Original", body: "<p>Hello</p>" })
    const initial = await getCoverLetter(id)

    expect(initial).toBeDefined()
    expect(initial?.createdAt).toEqual(initial?.updatedAt)
    expect(initial?.syncProfile).toBe(true)

    await delay(10)

    await updateCoverLetter(id, {
      title: "Updated",
      subject: "Application",
      body: "<p>Updated</p>",
    })
    const updated = await getCoverLetter(id)

    expect(updated?.title).toBe("Updated")
    expect(updated?.subject).toBe("Application")
    expect(updated?.createdAt).toEqual(initial?.createdAt)
    expect(updated!.updatedAt.getTime()).toBeGreaterThan(initial!.updatedAt.getTime())

    await deleteCoverLetter(id)
    expect(await getCoverLetter(id)).toBeUndefined()
  })

  it("returns cover letters sorted by latest updatedAt", async () => {
    await createCoverLetter({ title: "Letter 1", body: "<p>One</p>" })
    await delay(10)
    const targetId = await createCoverLetter({ title: "Letter 2", body: "<p>Two</p>" })
    await delay(10)
    await createCoverLetter({ title: "Letter 3", body: "<p>Three</p>" })
    await delay(10)

    await updateCoverLetter(targetId, { title: "Letter 2 (Updated)" })

    const letters = await getAllCoverLetters()
    expect(
      letters.map((letter) => {
        return letter.title
      }),
    ).toEqual(["Letter 2 (Updated)", "Letter 3", "Letter 1"])
  })

  it("searches by title and subject", async () => {
    await createCoverLetter({ title: "Backend Role", subject: "Acme", body: "<p>A</p>" })
    await createCoverLetter({ title: "Frontend Role", subject: "Globex", body: "<p>B</p>" })

    const byTitle = await queryCoverLetters({ query: "frontend", page: 1, perPage: 10 })
    expect(
      byTitle.items.map((letter) => {
        return letter.title
      }),
    ).toEqual(["Frontend Role"])

    const bySubject = await queryCoverLetters({ query: "acme", page: 1, perPage: 10 })
    expect(
      bySubject.items.map((letter) => {
        return letter.title
      }),
    ).toEqual(["Backend Role"])
  })

  it("persists direct tag IDs and hydrates sorted tags", async () => {
    const remoteId = await createTag({ name: "Remote", colour: "#abc" })
    const backendId = await createTag({ name: "Backend", colour: "#def" })
    await createCoverLetter(
      { title: "Remote application", body: "<p>One</p>" },
      { tagIds: [remoteId] },
    )
    await delay(5)
    await createCoverLetter(
      { title: "Backend application", body: "<p>Two</p>", subject: "Acme" },
      { tagIds: [backendId] },
    )
    await delay(5)
    await createCoverLetter(
      { title: "Other application", body: "<p>Three</p>" },
      { tagIds: [remoteId, backendId] },
    )

    const result = await queryCoverLetters({
      query: "application",
      page: 1,
      perPage: 10,
    })

    expect(result.items.map((letter) => letter.title)).toEqual([
      "Other application",
      "Backend application",
      "Remote application",
    ])
    expect(result.items[0]?.tags.map((tag) => tag.name)).toEqual(["Backend", "Remote"])

    const combined = await queryCoverLetters({
      query: "acme",
      page: 1,
      perPage: 10,
    })
    expect(combined.items.map((letter) => letter.title)).toEqual(["Backend application"])
  })

  it("normalises records without direct tag IDs at the read boundary", async () => {
    await db.coverLetters.add({
      id: "legacy-letter",
      title: "Existing letter",
      body: "<p>Hello</p>",
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as CoverLetter)

    const result = await queryCoverLetters({ query: "existing", page: 1, perPage: 10 })

    expect(result.items[0]?.tagIds).toEqual([])
    expect(result.items[0]?.tags).toEqual([])
  })

  it("bumps the entity timestamp and invalidates its PDF cache for tag assignments", async () => {
    const id = await createCoverLetter({ title: "Letter", body: "<p>Hello</p>" }, { tagIds: [] })
    const before = await getCoverLetter(id)
    await saveProcessedEntity({
      entityType: "coverLetter",
      entityId: id,
      blob: new Blob(["%PDF-fake"], { type: "application/pdf" }),
      processedAt: new Date(),
    })
    await delay(10)

    await updateCoverLetter(id, { tagIds: [3, 3, 0] })
    const after = await getCoverLetter(id)

    expect(after?.tagIds).toEqual([3])
    expect(after?.updatedAt.getTime()).toBeGreaterThan(before!.updatedAt.getTime())
    expect(
      await getValidProcessedEntity({
        entityType: "coverLetter",
        entityId: id,
        entityUpdatedAt: after!.updatedAt,
      }),
    ).toBeNull()
  })

  it("returns the effective pagination with its page slice", async () => {
    for (let index = 0; index < 5; index += 1) {
      await createCoverLetter({ title: `Letter ${index}`, body: "<p>Body</p>" })
      await delay(2)
    }

    const result = await queryCoverLetters({ query: "", page: 99, perPage: 2 })

    expect(result.pagination).toMatchObject({
      page: 3,
      perPage: 2,
      totalCount: 5,
      totalPages: 3,
    })
    expect(result.items).toHaveLength(1)
  })
})
