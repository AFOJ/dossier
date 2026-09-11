import { unzip } from "fflate"

export interface ZipJsonEntry {
  name: string
  text: string
}

export interface ZipSkippedEntry {
  name: string
  reason: string
}

export interface ExtractedZip {
  entries: ZipJsonEntry[]
  skipped: ZipSkippedEntry[]
}

const MAX_ZIP_ENTRIES = 50
export const MAX_ZIP_COMPRESSED_BYTES = 10 * 1024 * 1024
const MAX_ENTRY_UNCOMPRESSED_BYTES = 2 * 1024 * 1024
const MAX_TOTAL_UNCOMPRESSED_BYTES = 10 * 1024 * 1024

function isJsonName(name: string): boolean {
  return name.toLowerCase().endsWith(".json")
}

function decodeText(data: Uint8Array, name: string): string | null {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(data)
  } catch (error) {
    console.error("[zipImport] Failed to decode entry", { name, error })
    return null
  }
}

/**
 * Extracts resume JSON files from a ZIP archive (e.g. a bulk export).
 * Size guards run inside fflate's entry filter, before each entry is
 * inflated, so oversized archives can't exhaust browser memory. Invalid,
 * oversized, or non-JSON entries are reported in `skipped` so batch imports
 * can skip them accurately without aborting the whole archive.
 */
export async function extractResumeJsonFiles(file: File): Promise<ExtractedZip> {
  if (file.size > MAX_ZIP_COMPRESSED_BYTES) {
    throw new Error("ZIP file is too large (10 MB max).")
  }

  const bytes = new Uint8Array(await file.arrayBuffer())
  const nonJson: string[] = []
  const oversized: string[] = []
  const unsupported: string[] = []
  let totalUncompressed = 0

  const unzipped = await new Promise<Record<string, Uint8Array>>((resolve, reject) => {
    unzip(
      bytes,
      {
        filter: (entry) => {
          if (entry.name.endsWith("/")) {
            return false
          }
          if (!isJsonName(entry.name)) {
            nonJson.push(entry.name)
            return false
          }
          if (entry.compression !== 0 && entry.compression !== 8) {
            unsupported.push(entry.name)
            return false
          }
          if (
            entry.originalSize > MAX_ENTRY_UNCOMPRESSED_BYTES ||
            totalUncompressed + entry.originalSize > MAX_TOTAL_UNCOMPRESSED_BYTES
          ) {
            oversized.push(entry.name)
            return false
          }
          totalUncompressed += entry.originalSize
          return true
        },
      },
      (error, data) => {
        if (error) {
          reject(error)
          return
        }
        resolve(data as Record<string, Uint8Array>)
      },
    )
  }).catch((error: unknown) => {
    console.error("[zipImport] Failed to unzip archive", { fileName: file.name, error })
    throw new Error("Could not read ZIP file. It may be corrupted.")
  })

  // Re-list the archive directory so non-JSON entries can be reported as
  // skipped; names already excluded by the size filter are reported above.
  const names = Object.keys(unzipped).sort()
  const entries: ZipJsonEntry[] = []
  const skipped: ZipSkippedEntry[] = []

  for (const name of nonJson) {
    skipped.push({ name, reason: "Not a JSON file." })
  }
  for (const name of oversized) {
    skipped.push({ name, reason: "File is too large to import safely." })
  }
  for (const name of unsupported) {
    skipped.push({ name, reason: "Unsupported compression method." })
  }

  for (const name of names) {
    if (entries.length >= MAX_ZIP_ENTRIES) {
      skipped.push({ name, reason: "Batch limit reached (50 files max)." })
      continue
    }
    const text = decodeText(unzipped[name], name)
    if (text === null) {
      skipped.push({ name, reason: "Could not decode file." })
      continue
    }
    entries.push({ name, text })
  }

  return { entries, skipped }
}
