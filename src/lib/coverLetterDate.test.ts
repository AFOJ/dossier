import { describe, it, expect } from "vitest"
import { formatCoverLetterDate, isValidCoverLetterDate } from "@/lib/coverLetterDate"

describe("isValidCoverLetterDate", () => {
  it("accepts real calendar dates", () => {
    expect(isValidCoverLetterDate("2026-09-17")).toBe(true)
    expect(isValidCoverLetterDate("2024-02-29")).toBe(true)
  })

  it("rejects malformed or impossible dates", () => {
    expect(isValidCoverLetterDate("")).toBe(false)
    expect(isValidCoverLetterDate("17/09/2026")).toBe(false)
    expect(isValidCoverLetterDate("2026-13-01")).toBe(false)
    expect(isValidCoverLetterDate("2026-02-30")).toBe(false)
    expect(isValidCoverLetterDate("not-a-date")).toBe(false)
  })
})

describe("formatCoverLetterDate", () => {
  it("omits blank or invalid input", () => {
    expect(formatCoverLetterDate(undefined)).toBeUndefined()
    expect(formatCoverLetterDate(null)).toBeUndefined()
    expect(formatCoverLetterDate("")).toBeUndefined()
    expect(formatCoverLetterDate("  ")).toBeUndefined()
    expect(formatCoverLetterDate("2026-02-30")).toBeUndefined()
  })

  it("formats a valid date using the viewer's locale", () => {
    const formatted = formatCoverLetterDate("2026-09-17")

    expect(formatted).toBe(
      new Date(2026, 8, 17).toLocaleDateString(undefined, {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    )
    expect(formatted).toContain("2026")
  })
})
