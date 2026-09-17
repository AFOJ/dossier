import { describe, it, expect } from "vitest"
import type { CoverLetter } from "@/db/db"
import { toCoverLetterPayload } from "@/lib/coverLetterPayload"

function buildLetter(overrides: Partial<CoverLetter> = {}): CoverLetter {
  return {
    id: "letter-1",
    title: "Backend Engineer Application",
    subject: null,
    date: null,
    body: "<p>Hello</p>",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-02-01T00:00:00.000Z"),
    syncProfile: false,
    contact: null,
    ...overrides,
  }
}

describe("toCoverLetterPayload date", () => {
  it("includes the formatted date when set", async () => {
    const payload = await toCoverLetterPayload(buildLetter({ date: "2026-09-17" }))

    expect(payload.date).toContain("2026")
  })

  it("omits the date when unset so old behaviour is preserved", async () => {
    for (const date of [null, undefined, ""]) {
      const payload = await toCoverLetterPayload(buildLetter({ date: date as CoverLetter["date"] }))

      expect("date" in payload).toBe(false)
    }
  })
})
