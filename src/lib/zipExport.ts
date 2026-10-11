import { zip } from "fflate"
import { downloadBlob } from "@/lib/download"
import { uniqueFilename } from "@/lib/filenames"

export interface ZipEntry {
  filename: string
  payload: unknown
}

/**
 * Writes `entries` to a ZIP and saves it under `archiveName`.
 *
 * Duplicate filenames get a counter before their extension, so a set of items
 * sharing a title still produces a distinct entry for each.
 */
export async function saveJsonAsZip(archiveName: string, entries: ZipEntry[]): Promise<void> {
  const files: Record<string, Uint8Array> = {}
  const takenFilenames = new Set<string>()

  for (const entry of entries) {
    files[uniqueFilename(takenFilenames, entry.filename)] = new TextEncoder().encode(
      JSON.stringify(entry.payload, null, 2),
    )
  }

  await new Promise<void>((resolve, reject) => {
    zip(files, (err, data) => {
      if (err) {
        reject(err)
        return
      }
      downloadBlob(archiveName, new Blob([data], { type: "application/zip" }))
      resolve()
    })
  })
}
