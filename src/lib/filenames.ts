export function sanitizeFilename(filename: string): string {
  return (
    filename
      // eslint-disable-next-line no-control-regex
      .replace(/[<>:"\\|?*\u0000-\u001F]/g, "")
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
