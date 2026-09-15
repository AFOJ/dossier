import type { CoverLetter } from "@/db/db"
import { db } from "@/db/db"
import { entryToBlob, getValidProcessedEntity, saveProcessedEntity } from "@/db/entityCache"
import { processCoverLetter } from "@/lib/api"
import { toCoverLetterPayload } from "@/lib/coverLetterPayload"
import { slugify } from "@/utils"

export interface ProcessedCoverLetter {
  blob: Blob
  processedAt: Date
}

export async function ensureProcessedCoverLetter(
  letter: CoverLetter,
): Promise<ProcessedCoverLetter> {
  const cached = await getValidProcessedEntity({
    entityType: "coverLetter",
    entityId: letter.id!,
    entityUpdatedAt: letter.updatedAt,
  })

  if (cached) {
    return { blob: entryToBlob(cached), processedAt: cached.processedAt }
  }

  const expectedUpdatedAt = letter.updatedAt
  const blob = await processCoverLetter(await toCoverLetterPayload(letter))

  const currentLetter = await db.coverLetters.get(letter.id!)
  if (!currentLetter || currentLetter.updatedAt.getTime() !== expectedUpdatedAt.getTime()) {
    throw new Error("Cover letter was modified during PDF generation")
  }

  const processedAt = new Date()
  await saveProcessedEntity({ entityType: "coverLetter", entityId: letter.id!, blob, processedAt })

  return { blob, processedAt }
}

export function getProcessedCoverLetterFilename(title: string): string {
  return `${slugify(title)}-cover-letter.pdf`
}
