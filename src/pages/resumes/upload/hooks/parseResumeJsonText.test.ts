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
})
