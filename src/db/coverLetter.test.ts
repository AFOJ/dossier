import "fake-indexeddb/auto"
import {
  createCoverLetter,
  getCoverLetter,
  getAllCoverLetters,
  queryCoverLetters,
  updateCoverLetter,
  deleteCoverLetter,
} from "@/db/coverLetter"
import { db } from "@/db/db"
import { describe, it, expect, beforeEach } from "vitest"

const delay = (ms = 10) => new Promise((resolve) => setTimeout(resolve, ms))

beforeEach(async () => {
  await db.profiles.clear()
  await db.resumes.clear()
  await db.coverLetters.clear()
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
      signoff: "Kind regards,",
      body: "<p>Updated</p>",
    })
    const updated = await getCoverLetter(id)

    expect(updated?.title).toBe("Updated")
    expect(updated?.subject).toBe("Application")
    expect(updated?.signoff).toBe("Kind regards,")
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
