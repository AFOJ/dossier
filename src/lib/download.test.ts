import { slugify } from "@/utils"
import { describe, expect, it } from "vitest"
import {
  getExportFilenameWithSettings,
  getProcessedPdfFilename,
  getPdfFilenameWithSettings,
} from "@/lib/download"
import { DEFAULT_EXPORT_FILENAME_FORMAT } from "@/lib/titleFormat"
import {
  DEFAULT_PDF_FILENAME_FORMAT_SHARED,
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
      `my-resume (${slugify(dateShort)}).pdf`,
    )
  })

  it("normalizes generated date tokens while preserving custom format text", () => {
    const date = new Date(2026, 9, 31)
    const renderedDate = slugify(
      date.toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" }),
    )
    expect(
      getProcessedPdfFilename("resume", "My Document", "oj-abba-{title}-resume-{date}.pdf", date),
    ).toBe(`oj-abba-my-document-resume-${renderedDate}.pdf`)
    expect(getProcessedPdfFilename("resume", "My Document", "Custom_{month}-{day}.PDF", date)).toBe(
      `Custom_${slugify(date.toLocaleDateString(undefined, { month: "long" }))}-31.PDF`,
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

describe("getPdfFilenameWithSettings", () => {
  const baseSettings = {
    pdfFilenamePattern: "ad-hoc" as const,
    defaultPdfFilenameFormat: DEFAULT_PDF_FILENAME_FORMAT_SHARED,
    defaultResumePdfFilenameFormat: DEFAULT_PDF_FILENAME_FORMAT_RESUME,
    defaultCoverLetterPdfFilenameFormat: DEFAULT_PDF_FILENAME_FORMAT_COVER_LETTER,
  }

  it("uses the per-kind format in ad hoc mode", () => {
    expect(getPdfFilenameWithSettings("resume", "My Resume", { exports: baseSettings }, DATE)).toBe(
      "my-resume-resume.pdf",
    )
    expect(
      getPdfFilenameWithSettings("cover-letter", "My Letter", { exports: baseSettings }, DATE),
    ).toBe("my-letter-cover-letter.pdf")
  })

  it("uses the shared format in shared mode, with {kind} telling them apart", () => {
    const settings = { ...baseSettings, pdfFilenamePattern: "shared" as const }

    expect(getPdfFilenameWithSettings("resume", "My Resume", { exports: settings }, DATE)).toBe(
      "my-resume-resume.pdf",
    )
    expect(
      getPdfFilenameWithSettings("cover-letter", "My Letter", { exports: settings }, DATE),
    ).toBe("my-letter-cover-letter.pdf")
  })

  it("uses a custom shared format over a custom per-kind format", () => {
    const settings = {
      ...baseSettings,
      pdfFilenamePattern: "shared" as const,
      defaultPdfFilenameFormat: "{kind}-{title}-{year}.pdf",
    }

    expect(getPdfFilenameWithSettings("resume", "My Resume", { exports: settings }, DATE)).toBe(
      "resume-my-resume-2026.pdf",
    )
  })
})

describe("getExportFilenameWithSettings", () => {
  const settings = { defaultExportFilenameFormat: DEFAULT_EXPORT_FILENAME_FORMAT }

  it("renders the default format and keeps the .json suffix", () => {
    expect(getExportFilenameWithSettings("resume", "My Resume", { exports: settings }, DATE)).toBe(
      "resume-my-resume-export-sep-17-2026.json",
    )
  })

  it("does not double the .json suffix when the format carries one", () => {
    expect(
      getExportFilenameWithSettings(
        "resume",
        "My Resume",
        { exports: { defaultExportFilenameFormat: "{title}.json" } },
        DATE,
      ),
    ).toBe("my-resume.json")
  })

  it("falls back to the kind when the title is empty", () => {
    expect(getExportFilenameWithSettings("resume", "", { exports: settings }, DATE)).toBe(
      "resume-resume-export-sep-17-2026.json",
    )
  })
})
