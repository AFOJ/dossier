import { describe, expect, it } from "vitest"
import { getProcessedPdfFilename } from "@/lib/download"
import {
  DEFAULT_PDF_FILENAME_FORMAT_RESUME,
  DEFAULT_PDF_FILENAME_FORMAT_COVER_LETTER,
} from "@/lib/titleFormat"

const DATE = new Date(2026, 8, 17)

describe("getProcessedPdfFilename", () => {
  it("reproduces the historical resume name under the default format", () => {
    expect(
      getProcessedPdfFilename("resume", "My Resume", DEFAULT_PDF_FILENAME_FORMAT_RESUME, DATE),
    ).toBe("my-resume-resume.pdf")
  })

  it("reproduces the historical cover letter name under the default format", () => {
    expect(
      getProcessedPdfFilename(
        "cover-letter",
        "My Letter",
        DEFAULT_PDF_FILENAME_FORMAT_COVER_LETTER,
        DATE,
      ),
    ).toBe("my-letter-cover-letter.pdf")
  })

  it("falls back to the kind when the title slugifies to nothing", () => {
    expect(getProcessedPdfFilename("resume", "", DEFAULT_PDF_FILENAME_FORMAT_RESUME, DATE)).toBe(
      "resume-resume.pdf",
    )
    expect(
      getProcessedPdfFilename(
        "cover-letter",
        "   ",
        DEFAULT_PDF_FILENAME_FORMAT_COVER_LETTER,
        DATE,
      ),
    ).toBe("cover-letter-cover-letter.pdf")
  })

  it("lets resume and cover letter formats diverge", () => {
    expect(getProcessedPdfFilename("resume", "My Resume", "{title}-CV.pdf", DATE)).toBe(
      "my-resume-CV.pdf",
    )
    expect(
      getProcessedPdfFilename("cover-letter", "My Letter", "{title}-CL-{year}.pdf", DATE),
    ).toBe("my-letter-CL-2026.pdf")
  })

  it("supports the shared date tokens", () => {
    const dateShort = DATE.toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
    expect(getProcessedPdfFilename("resume", "My Resume", "{title} ({dateShort})", DATE)).toBe(
      `my-resume (${dateShort}).pdf`,
    )
  })

  it("leaves unknown tokens verbatim", () => {
    expect(getProcessedPdfFilename("resume", "My Resume", "{title}-{nope}.pdf", DATE)).toBe(
      "my-resume-{nope}.pdf",
    )
  })

  it("sanitizes invalid filename characters", () => {
    expect(getProcessedPdfFilename("resume", 'A: "Quoted"?', "{title}", DATE)).toBe("a-quoted.pdf")
  })

  it("does not double the .pdf suffix", () => {
    expect(getProcessedPdfFilename("resume", "My Resume", "{title}-resume.PDF", DATE)).toBe(
      "my-resume-resume.PDF",
    )
  })
})
