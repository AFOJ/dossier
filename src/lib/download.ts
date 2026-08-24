export function downloadJson(filename: string, data: unknown): void {
  downloadBlob(
    filename,
    new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }),
  )
}

export function downloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob)

  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()

  URL.revokeObjectURL(url)
}

export type ExportKind = 'profile' | 'resume'

export function getExportFilename(
  kind: ExportKind,
  date = new Date(),
  label?: string,
): string {
  const suffix = label ? `-${label}` : ''
  return `dossier-${kind}${suffix}-export-${date.toISOString().slice(0, 10)}.json`
}
