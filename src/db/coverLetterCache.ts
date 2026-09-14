import { db, type CoverLetterCacheEntry } from "@/db/db"

export const COVER_LETTER_CACHE_TTL_MS = 24 * 60 * 60 * 1000

interface SaveProcessedCoverLetterOptions {
  processedAt?: Date
  ttlMs?: number
}

export async function getValidProcessedCoverLetter(
  coverLetterId: string,
  coverLetterUpdatedAt: Date,
): Promise<CoverLetterCacheEntry | undefined> {
  const entry = await db.coverLetterCache.get(coverLetterId)

  if (!entry) {
    return undefined
  }

  const isFresh = entry.expiresAt.getTime() > Date.now()
  const isCurrent = entry.processedAt.getTime() >= coverLetterUpdatedAt.getTime()

  if (!isFresh || !isCurrent) {
    await db.coverLetterCache.delete(coverLetterId)
    return undefined
  }

  return entry
}

export async function saveProcessedCoverLetter(
  coverLetterId: string,
  blob: Blob,
  options: SaveProcessedCoverLetterOptions = {},
): Promise<void> {
  const processedAt = options.processedAt ?? new Date()
  const ttlMs = options.ttlMs ?? COVER_LETTER_CACHE_TTL_MS

  await db.coverLetterCache.put({
    coverLetterId,
    data: await blob.arrayBuffer(),
    contentType: blob.type,
    processedAt,
    expiresAt: new Date(processedAt.getTime() + ttlMs),
  })
}

export function entryToBlob(entry: CoverLetterCacheEntry): Blob {
  return new Blob([entry.data], { type: entry.contentType })
}

export async function clearProcessedCoverLetterCache(coverLetterId: string): Promise<void> {
  await db.coverLetterCache.delete(coverLetterId)
}