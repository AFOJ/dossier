import { describe, it, expect } from "vitest"
import { parseCoverLetterJsonText } from "@/pages/cover-letters/upload/hooks/parseCoverLetterJsonFile"

const fullCoverLetter = {
  id: "123e4567-e89b-12d3-a456-426614174000",
  title: "Backend Engineer Application",
  subject: null,
  body: "<p>Hello</p>",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-02-01T00:00:00.000Z",
  syncProfile: false,
  contact: null,
}

describe("parseCoverLetterJsonText", () => {
  it("parses a full cover letter export", () => {
    const result = parseCoverLetterJsonText(JSON.stringify(fullCoverLetter), "letter.json")

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.letterId).toBe("123e4567-e89b-12d3-a456-426614174000")
      expect(result.letter.title).toBe("Backend Engineer Application")
    }
  })

  it("points resume exports to the Resumes page", () => {
    const resumeExport = {
      id: "123e4567-e89b-12d3-a456-426614174000",
      title: "Frontend Engineer",
      sections: [],
      syncProfile: true,
      contact: null,
    }
    const result = parseCoverLetterJsonText(
      JSON.stringify(resumeExport),
      "dossier-resume-export.json",
    )

    expect(result).toEqual({
      success: false,
      error: "This looks like a resume export. Import it on the Resumes page instead.",
    })
  })
})
