import { beforeEach, describe, expect, it } from "vitest"
import { db } from "@/db/db"
import { saveProcessedEntity } from "@/db/entityCache"
import { createCoverLetter } from "@/db/coverLetter"
import { createResume } from "@/db/resume"
import {
  createTag,
  deleteTag,
  listTags,
  sortTags,
  tagColourToCss,
  tagTextColour,
  updateTag,
} from "@/db/tag"

const delay = (ms = 10) => new Promise((resolve) => setTimeout(resolve, ms))
const PDF = () => new Blob(["%PDF-fake"], { type: "application/pdf" })

beforeEach(async () => {
  await db.profiles.clear()
  await db.tags.clear()
  await db.resumes.clear()
  await db.coverLetters.clear()
  await db.entityCache.clear()
})

describe("tag catalog", () => {
  it("creates normalised tags with equal timestamps and an auto-generated id", async () => {
    const id = await createTag({
      name: "  Remote  ",
      description: "  Remote work  ",
      colour: "#aabbcc",
    })

    const tag = await db.tags.get(id)
    expect(id).toEqual(expect.any(Number))
    expect(tag).toMatchObject({
      name: "Remote",
      description: "Remote work",
      normalizedName: "remote",
      colour: "#AABBCC",
    })
    expect(tag?.createdAt).toEqual(tag?.updatedAt)
  })

  it("enforces trimmed case-insensitive unique names and validates limits/colours", async () => {
    await createTag({ name: "Remote", colour: "#abc" })

    await expect(createTag({ name: "  remote ", colour: "#def" })).rejects.toThrow("already exists")
    await expect(createTag({ name: "x".repeat(51), colour: "#def" })).rejects.toThrow(
      "between 1 and 50",
    )
    await expect(createTag({ name: "Valid", colour: "12" })).rejects.toThrow("hex value")
  })

  it("lists tags alphabetically by normalised name", async () => {
    await createTag({ name: "remote", colour: "#abc" })
    await createTag({ name: "Backend", colour: "#def" })
    await createTag({ name: "Analyst", colour: "#123" })

    expect((await listTags()).map((tag) => tag.name)).toEqual(["Analyst", "Backend", "remote"])
  })

  it("uses a safe preview colour for incomplete records", () => {
    expect(tagColourToCss(undefined)).toBe("#2563EB")
    expect(tagColourToCss("abc")).toBe("#ABC")
  })

  it("chooses readable tag text for light and dark backgrounds", () => {
    expect(tagTextColour("#FFFFFF")).toBe("#1F2328")
    expect(tagTextColour("#000000")).toBe("#FFFFFF")
    expect(tagTextColour("#abc")).toBe(tagTextColour("#AABBCC"))
  })

  it("uses tag IDs as a stable tie-breaker", () => {
    const first = {
      id: 2,
      name: "Remote",
      normalizedName: "remote",
      colour: "#ABC",
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    const second = { ...first, id: 1 }

    expect(sortTags([first, second]).map((tag) => tag.id)).toEqual([1, 2])
  })

  it("updates only the tag timestamp and normalised fields", async () => {
    const id = await createTag({ name: "Remote", description: "Work", colour: "#abc" })
    const before = await db.tags.get(id)
    await delay()

    await updateTag(id, { name: "  Anywhere  ", description: "  New  ", colour: "#def" })
    const after = await db.tags.get(id)

    expect(after?.name).toBe("Anywhere")
    expect(after?.description).toBe("New")
    expect(after?.normalizedName).toBe("anywhere")
    expect(after?.colour).toBe("#DEF")
    expect(after?.createdAt).toEqual(before?.createdAt)
    expect(after?.updatedAt.getTime()).toBeGreaterThan(before!.updatedAt.getTime())
  })

  it("deletes a tag from both entity types while preserving other IDs and clearing caches", async () => {
    const deletedId = await createTag({ name: "Remote", colour: "#abc" })
    const keptId = await createTag({ name: "Keep", colour: "#def" })
    const resumeId = await createResume("Resume", [], { tagIds: [deletedId, keptId] })
    const letterId = await createCoverLetter(
      { title: "Letter", body: "<p>Hello</p>" },
      { tagIds: [deletedId, keptId] },
    )
    await saveProcessedEntity({ entityType: "resume", entityId: resumeId, blob: PDF() })
    await saveProcessedEntity({ entityType: "coverLetter", entityId: letterId, blob: PDF() })
    const resumeBefore = await db.resumes.get(resumeId)
    const letterBefore = await db.coverLetters.get(letterId)

    await deleteTag(deletedId)

    expect(await db.tags.get(deletedId)).toBeUndefined()
    expect((await db.resumes.get(resumeId))?.tagIds).toEqual([keptId])
    expect((await db.coverLetters.get(letterId))?.tagIds).toEqual([keptId])
    expect((await db.resumes.get(resumeId))?.updatedAt.getTime()).toBeGreaterThan(
      resumeBefore!.updatedAt.getTime(),
    )
    expect((await db.coverLetters.get(letterId))?.updatedAt.getTime()).toBeGreaterThan(
      letterBefore!.updatedAt.getTime(),
    )
    expect(await db.entityCache.count()).toBe(0)
  })
})
