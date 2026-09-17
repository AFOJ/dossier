import { describe, it, expect } from "vitest"
import { parseResumeJsonText } from "@/pages/resumes/upload/hooks/parseResumeJsonFile"

const fullResume = {
  id: "123e4567-e89b-12d3-a456-426614174000",
  title: "Frontend Engineer",
  sections: [],
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-02-01T00:00:00.000Z",
  syncProfile: false,
  contact: null,
}

describe("parseResumeJsonText", () => {
  it("parses a full resume export", () => {
    const result = parseResumeJsonText(JSON.stringify(fullResume), "resume.json")

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.resumeId).toBe("123e4567-e89b-12d3-a456-426614174000")
      expect(result.resume.title).toBe("Frontend Engineer")
      expect(result.resume.createdAt).toEqual(new Date("2026-01-01T00:00:00.000Z"))
    }
  })

  it("accepts a payload without an id and assigns one", () => {
    const result = parseResumeJsonText(
      JSON.stringify({ title: "Payload", sections: [] }),
      "payload.json",
    )

    expect(result.success).toBe(true)
    if (result.success) {
      expect(typeof result.resumeId).toBe("string")
      expect(result.resume.title).toBe("Payload")
    }
  })

  it("reports invalid JSON without throwing", () => {
    const result = parseResumeJsonText("{not json", "broken.json")

    expect(result).toEqual({ success: false, error: "File is not valid JSON." })
  })

  it("reports a non-object root", () => {
    const result = parseResumeJsonText(JSON.stringify([1, 2, 3]), "array.json")

    expect(result).toEqual({ success: false, error: "File does not contain a resume object." })
  })

  it("reports the first schema violation", () => {
    const result = parseResumeJsonText(JSON.stringify({ ...fullResume, title: "" }), "invalid.json")

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain("Title is required")
    }
  })

  it("points cover letter exports to the Cover Letters page", () => {
    const coverLetterExport = {
      id: "fd7d755a-1f6e-4982-9f8b-e93bbe8d5d29",
      title: "Frontend Engineer - PayZeep",
      subject: null,
      body: "<p>Good day,</p>",
      syncProfile: false,
      contact: { full_name: "OJ Abba" },
    }
    const result = parseResumeJsonText(
      JSON.stringify(coverLetterExport),
      "dossier-cover-letter-export.json",
    )

    expect(result).toEqual({
      success: false,
      error: "This looks like a cover letter export. Import it on the Cover Letters page instead.",
    })
  })
})
