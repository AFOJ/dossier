import { db, type ResumeCacheEntry } from '@/db/db'

/** How long a processed resume stays fresh before it must be refetched. */
export const RESUME_CACHE_TTL_MS = 24 * 60 * 60 * 1000

interface SaveProcessedResumeOptions {
  processedAt?: Date
  ttlMs?: number
}

/**
 * Returns the cached processed resume when it is still within its TTL and
 * was processed at-or-after the resume's last update. Expired or stale
 * entries are treated as misses and removed.
 */
export async function getValidProcessedResume(
  resumeId: string,
  resumeUpdatedAt: Date,
): Promise<ResumeCacheEntry | undefined> {
  const entry = await db.resumeCache.get(resumeId)

  if (!entry) {
    return undefined
  }

  const isFresh = entry.expiresAt.getTime() > Date.now()
  const isCurrent = entry.processedAt.getTime() >= resumeUpdatedAt.getTime()

  if (!isFresh || !isCurrent) {
    await db.resumeCache.delete(resumeId)
    return undefined
  }

  return entry
}

export async function saveProcessedResume(
  resumeId: string,
  blob: Blob,
  options: SaveProcessedResumeOptions = {},
): Promise<void> {
  const processedAt = options.processedAt ?? new Date()
  const ttlMs = options.ttlMs ?? RESUME_CACHE_TTL_MS

  await db.resumeCache.put({
    resumeId,
    data: await blob.arrayBuffer(),
    contentType: blob.type,
    processedAt,
    expiresAt: new Date(processedAt.getTime() + ttlMs),
  })
}

/** Rebuilds a Blob from a cached entry for previews/downloads. */
export function entryToBlob(entry: ResumeCacheEntry): Blob {
  return new Blob([entry.data], { type: entry.contentType })
}

export async function clearProcessedResumeCache(
  resumeId: string,
): Promise<void> {
  await db.resumeCache.delete(resumeId)
}
