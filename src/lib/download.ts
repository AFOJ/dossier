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

export type ExportKind = "profile" | "resume" | "cover-letter"

export function sanitizeFilename(filename: string): string {
  return filename
    // eslint-disable-next-line no-control-regex
    .replace(/[<>:"\\|?*\u0000-\u001F]/g, "")
    .replace(/^\.+/, "")
    .slice(0, 255)
}

export function getExportFilename(kind: ExportKind, date = new Date(), label?: string): string {
  const suffix = label ? `-${label}` : ""
  return `dossier-${kind}${suffix}-export-${date.toISOString().slice(0, 10)}.json`
}

export function getExportFilenameWithSettings(
  kind: ExportKind,
  title: string,
  settings: { defaultExportFilenameFormat: string },
  date = new Date()
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
    title: title,
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

  const result = format.replace(/\{([a-zA-Z]+)\}/g, (match, token) => {
    return tokens[token] ?? match
  })

  return sanitizeFilename(result)
}
