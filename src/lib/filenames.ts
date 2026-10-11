export function sanitizeFilename(filename: string): string {
  return (
    filename
      // eslint-disable-next-line no-control-regex
      .replace(/[<>:"\\|?*/\u0000-\u001F]/g, "")
      .replace(/^\.+/, "")
      .slice(0, 255)
  )
}

/**
 * Appends `extension` unless the name already ends with it, compared without
 * regard to case. Keeps a rendered format that omits the extension — or carries
 * a differently-cased one — from producing a file the import pickers reject.
 */
export function withExtension(filename: string, extension: string): string {
  const lowered = filename.toLowerCase()

  return lowered.endsWith(extension.toLowerCase()) ? filename : `${filename}${extension}`
}

/**
 * Returns `filename` with its final extension swapped for `extension`.
 *
 * Used where a rendered filename already carries one and a different one is
 * needed — a JSON export name being reused as a ZIP archive name, say — so the
 * result is a single extension rather than `.json.zip`.
 */
export function replaceExtension(filename: string, extension: string): string {
  const lastDot = filename.lastIndexOf(".")

  // A leading dot belongs to the name, not to an extension, so only a dot that
  // has something before it marks one.
  const stem = lastDot > 0 ? filename.slice(0, lastDot) : filename

  return withExtension(stem, extension)
}

/**
 * Returns `base`, or `base` with a counter inserted before its extension when
 * `base` has already been handed out. Names handed out here are also recorded,
 * so a set of near-identical titles still produces distinct entries.
 */
export function uniqueFilename(taken: Set<string>, base: string): string {
  if (!taken.has(base)) {
    taken.add(base)
    return base
  }

  const dotIndex = base.lastIndexOf(".")
  const stem = base.slice(0, dotIndex)
  const extension = base.slice(dotIndex)
  let counter = 2
  let candidate = `${stem}-${counter}${extension}`
  while (taken.has(candidate)) {
    counter += 1
    candidate = `${stem}-${counter}${extension}`
  }
  taken.add(candidate)
  return candidate
}
