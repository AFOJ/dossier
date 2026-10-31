import type { Settings } from "@/db/settings"
export function downloadJson(filename: string, data: unknown): void {
  downloadBlob(filename, new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }))
}

export function downloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob)

  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  anchor.click()

  URL.revokeObjectURL(url)
}

import { slugify } from "@/utils"
import { sanitizeFilename, withExtension } from "@/lib/filenames"

export type ExportKind = "profile" | "resume" | "cover-letter"

export type PdfKind = "resume" | "cover-letter"

export function getExportFilenameWithSettings(
  kind: ExportKind,
  title: string,
  settings: { exports: Pick<Settings["exports"], "defaultExportFilenameFormat"> },
  date = new Date(),
): string {
  const format = settings.exports.defaultExportFilenameFormat
  const dateShort = date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
  const year = date.getFullYear().toString()
  const month = date.toLocaleDateString(undefined, { month: "long" })
  const monthShort = date.toLocaleDateString(undefined, { month: "short" })
  const day = date.getDate().toString()

  const tokens: Record<string, string> = {
    kind: kind,
    title: slugify(title) || kind,
    date: date.toLocaleDateString(undefined, {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    dateShort,
    year,
    month,
    monthShort,
    day,
  }

  const rendered = sanitizeFilename(renderFilenameFormat(format, tokens))
  return withExtension(rendered, ".json")
}

function renderFilenameFormat(format: string, tokens: Record<string, string>): string {
  return format.replace(/\{([a-zA-Z]+)\}/g, (match, token) => {
    const value = tokens[token]
    if (value === undefined) {
      return match
    }
    return value
      .normalize("NFKC")
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\p{M}]+/gu, "-")
      .replace(/^-+|-+$/g, "")
  })
}

/**
 * Builds a PDF download filename from a user-configurable format.
 *
 * `{title}` always resolves to the slugified title, falling back to the
 * document kind ("resume" or "cover-letter"). `{kind}` resolves to the
 * document kind, enabling a shared pattern like `{title}-{kind}.pdf`. A
 * `.pdf` suffix is appended unless the rendered name already ends with one.
 */
export function getProcessedPdfFilename(
  kind: PdfKind,
  title: string,
  format: string,
  date = new Date(),
): string {
  const dateShort = date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  })

  const tokens: Record<string, string> = {
    kind: kind,
    title: slugify(title) || kind,
    date: date.toLocaleDateString(undefined, {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    dateShort,
    year: date.getFullYear().toString(),
    month: date.toLocaleDateString(undefined, { month: "long" }),
    monthShort: date.toLocaleDateString(undefined, { month: "short" }),
    day: date.getDate().toString(),
  }

  const rendered = sanitizeFilename(renderFilenameFormat(format, tokens))
  return withExtension(rendered, ".pdf")
}

/**
 * Builds a PDF download filename from the saved settings.
 *
 * When the pattern is "shared" the single `defaultPdfFilenameFormat` is used for
 * every document kind (it typically contains `{kind}` to tell them apart);
 * otherwise each kind has its own format. Naming follows the same rules as
 * `getProcessedPdfFilename`.
 */
export function getPdfFilenameWithSettings(
  kind: PdfKind,
  title: string,
  settings: { exports: Omit<Settings["exports"], "defaultExportFilenameFormat"> },
  date = new Date(),
): string {
  const format =
    settings.exports.pdfFilenamePattern === "shared"
      ? settings.exports.defaultPdfFilenameFormat
      : kind === "resume"
        ? settings.exports.defaultResumePdfFilenameFormat
        : settings.exports.defaultCoverLetterPdfFilenameFormat

  return getProcessedPdfFilename(kind, title, format, date)
}
