import { describe, it, expect } from "vitest"
import { coverLetterFormSchema } from "@/pages/cover-letters/create/hooks/useCreateCoverLetterForm"

const base = {
  title: "Backend Engineer Application",
  body: "<p>Hello</p>",
  syncProfile: true,
}

describe("coverLetterFormSchema date", () => {
  it("accepts a missing or valid date", () => {
    expect(coverLetterFormSchema.safeParse(base).success).toBe(true)
    expect(coverLetterFormSchema.safeParse({ ...base, date: "" }).success).toBe(true)
    expect(coverLetterFormSchema.safeParse({ ...base, date: "2026-09-17" }).success).toBe(true)
  })

  it("rejects an invalid date", () => {
    const result = coverLetterFormSchema.safeParse({ ...base, date: "2026-02-30" })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]).toMatchObject({ path: ["date"] })
    }
  })
})
