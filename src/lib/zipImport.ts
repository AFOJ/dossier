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
 * Invalid or non-JSON entries are reported in `skipped` so batch imports
 * can skip them accurately without aborting the whole archive.
 */
export async function extractResumeJsonFiles(file: File): Promise<ExtractedZip> {
  const bytes = new Uint8Array(await file.arrayBuffer())

  const unzipped = await new Promise<Record<string, Uint8Array>>((resolve, reject) => {
    unzip(bytes, (error, data) => {
      if (error) {
        reject(error)
        return
      }
      resolve(data as Record<string, Uint8Array>)
    })
  }).catch((error: unknown) => {
    console.error("[zipImport] Failed to unzip archive", { fileName: file.name, error })
    throw new Error("Could not read ZIP file. It may be corrupted.")
  })

  const names = Object.keys(unzipped).sort()
  const entries: ZipJsonEntry[] = []
  const skipped: ZipSkippedEntry[] = []

  for (const name of names) {
    if (name.endsWith("/")) {
      continue
    }
    if (!isJsonName(name)) {
      skipped.push({ name, reason: "Not a JSON file." })
      continue
    }
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
