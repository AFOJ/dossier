import { describe, expect, it } from "vitest"
import type { CoverLetter } from "@/db/db"
import { toCoverLetterExportPayload } from "@/lib/coverLetterExport"

function makeLetter(overrides: Partial<CoverLetter> = {}): CoverLetter {
  return {
    id: "letter-1",
    title: "Backend Application",
    subject: null,
    date: null,
    body: "<p>Hello</p>",
    tagIds: [],
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-02-01T00:00:00.000Z"),
    syncProfile: true,
    contact: null,
    ...overrides,
  }
}

describe("toCoverLetterExportPayload", () => {
  it("omits tag metadata", () => {
    const payload = toCoverLetterExportPayload(makeLetter({ tagIds: [1] }))

    expect(payload).not.toHaveProperty("tagIds")
    expect(payload).not.toHaveProperty("tags")
  })
})
