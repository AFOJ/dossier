import { zip } from "fflate"
import { downloadBlob } from "@/lib/download"
import { slugify } from "@/utils"
import type { CoverLetter } from "@/db/db"

export interface CoverLetterExportPayload {
  id: CoverLetter["id"]
  title: string
  subject: CoverLetter["subject"]
  signoff: CoverLetter["signoff"]
  body: string
  createdAt: string
  updatedAt: string
  syncProfile: CoverLetter["syncProfile"]
  contact: CoverLetter["contact"]
}

export function toCoverLetterExportPayload(letter: CoverLetter): CoverLetterExportPayload {
  return {
    id: letter.id,
    title: letter.title.trim(),
    subject: letter.subject ?? null,
    signoff: letter.signoff ?? null,
    body: letter.body,
    createdAt: letter.createdAt.toISOString(),
    updatedAt: letter.updatedAt.toISOString(),
    syncProfile: letter.syncProfile,
    contact: letter.contact,
  }
}

function uniqueFilename(taken: Set<string>, base: string): string {
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

export async function exportCoverLettersAsZip(letters: CoverLetter[]): Promise<void> {
  const files: Record<string, Uint8Array> = {}
  const takenFilenames = new Set<string>()

  for (const letter of letters) {
    const filename = uniqueFilename(
      takenFilenames,
      `${slugify(letter.title) || "cover-letter"}-cover-letter.json`,
    )
    files[filename] = new TextEncoder().encode(
      JSON.stringify(toCoverLetterExportPayload(letter), null, 2),
    )
  }

  const dateStr = new Date().toISOString().slice(0, 10)
  const zipFilename = `dossier-cover-letters-export-${dateStr}.zip`

  await new Promise<void>((resolve, reject) => {
    zip(files, (err, data) => {
      if (err) {
        reject(err)
        return
      }
      downloadBlob(zipFilename, new Blob([data], { type: "application/zip" }))
      resolve()
    })
  })
}
