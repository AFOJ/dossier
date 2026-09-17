const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/

function parseIsoDate(value: string): Date | undefined {
  const match = ISO_DATE_PATTERN.exec(value.trim())
  if (!match) {
    return undefined
  }

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const parsed = new Date(year, month - 1, day)

  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return undefined
  }

  return parsed
}

export function isValidCoverLetterDate(value: string): boolean {
  return parseIsoDate(value) !== undefined
}

/**
 * Formats a stored yyyy-mm-dd cover letter date for the processing
 * backend, which renders the string verbatim. Uses the viewer's locale
 * (e.g. "17 September 2026"). Returns undefined for blank/invalid input
 * so the payload key is omitted and old behaviour is preserved.
 */
export function formatCoverLetterDate(value: string | null | undefined): string | undefined {
  if (!value || value.trim() === "") {
    return undefined
  }

  const parsed = parseIsoDate(value)
  if (!parsed) {
    return undefined
  }

  return parsed.toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}
