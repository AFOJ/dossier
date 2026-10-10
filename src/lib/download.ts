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

export type ExportKind = "profile" | "resume" | "cover-letter"

export type PdfKind = "resume" | "cover-letter"

export function sanitizeFilename(filename: string): string {
  return (
    filename
      // eslint-disable-next-line no-control-regex
      .replace(/[<>:"\\|?*\u0000-\u001F]/g, "")
      .replace(/^\.+/, "")
      .slice(0, 255)
  )
}

export function getExportFilename(kind: ExportKind, date = new Date(), label?: string): string {
  const suffix = label ? `-${label}` : ""
  return `dossier-${kind}${suffix}-export-${date.toISOString().slice(0, 10)}.json`
}

export function getExportFilenameWithSettings(
  kind: ExportKind,
  title: string,
  settings: { defaultExportFilenameFormat: string },
  date = new Date(),
): string {
  const format = settings.defaultExportFilenameFormat
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

  return sanitizeFilename(renderFilenameFormat(format, tokens))
}

function renderFilenameFormat(format: string, tokens: Record<string, string>): string {
  return format.replace(/\{([a-zA-Z]+)\}/g, (match, token) => {
    return tokens[token] ?? match
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

  return rendered.toLowerCase().endsWith(".pdf") ? rendered : `${rendered}.pdf`
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
  settings: {
    pdfFilenamePattern: "shared" | "ad-hoc"
    defaultPdfFilenameFormat: string
    defaultResumePdfFilenameFormat: string
    defaultCoverLetterPdfFilenameFormat: string
  },
  date = new Date(),
): string {
  const format =
    settings.pdfFilenamePattern === "shared"
      ? settings.defaultPdfFilenameFormat
      : kind === "resume"
        ? settings.defaultResumePdfFilenameFormat
        : settings.defaultCoverLetterPdfFilenameFormat

  return getProcessedPdfFilename(kind, title, format, date)
}
