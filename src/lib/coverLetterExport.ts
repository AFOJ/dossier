import { saveJsonAsZip, type ZipEntry } from "@/lib/zipExport"
import type { CoverLetter } from "@/db/db"

export interface CoverLetterExportPayload {
  id: CoverLetter["id"]
  title: string
  subject: CoverLetter["subject"]
  date: CoverLetter["date"]
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
    date: letter.date ?? null,
    body: letter.body,
    createdAt: letter.createdAt.toISOString(),
    updatedAt: letter.updatedAt.toISOString(),
    syncProfile: letter.syncProfile,
    contact: letter.contact,
  }
}

export async function exportCoverLettersAsZip(
  archiveName: string,
  letters: CoverLetter[],
  nameEntry: (letter: CoverLetter) => string,
): Promise<void> {
  const entries: ZipEntry[] = letters.map((letter) => ({
    filename: nameEntry(letter),
    payload: toCoverLetterExportPayload(letter),
  }))

  await saveJsonAsZip(archiveName, entries)
}
