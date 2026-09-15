import { db } from "@/db/db"
import type { CacheEntityType, EntityCacheEntry } from "@/db/db"

export const CACHE_TTL_MS = 24 * 60 * 60 * 1000

interface GetValidProcessedEntityOptions {
  entityType: CacheEntityType
  entityId: string
  entityUpdatedAt: Date
}

interface SaveProcessedEntityOptions {
  entityType: CacheEntityType
  entityId: string
  blob: Blob
  processedAt?: Date
  ttlMs?: number
}

function cacheKey(entityType: CacheEntityType, entityId: string): string {
  return `${entityType}:${entityId}`
}

export async function getValidProcessedEntity(
  options: GetValidProcessedEntityOptions,
): Promise<EntityCacheEntry | null> {
  const { entityType, entityId, entityUpdatedAt } = options
  const key = cacheKey(entityType, entityId)
  const entry = await db.entityCache.get(key)

  if (!entry) {
    return null
  }

  const isFresh = entry.expiresAt.getTime() > Date.now()
  const isCurrent = entry.processedAt.getTime() >= entityUpdatedAt.getTime()

  if (!isFresh || !isCurrent) {
    await db.entityCache.delete(key)
    return null
  }

  return entry
}

export async function saveProcessedEntity(options: SaveProcessedEntityOptions): Promise<void> {
  const { entityType, entityId, blob, processedAt, ttlMs } = options
  const savedAt = processedAt ?? new Date()
  const expiresAt = new Date(savedAt.getTime() + (ttlMs ?? CACHE_TTL_MS))

  await db.entityCache.put({
    id: cacheKey(entityType, entityId),
    entityType,
    entityId,
    data: await blob.arrayBuffer(),
    contentType: blob.type,
    processedAt: savedAt,
    expiresAt,
  })
}

export function entryToBlob(entry: EntityCacheEntry): Blob {
  return new Blob([entry.data], { type: entry.contentType })
}

export async function clearProcessedEntityCache(options: {
  entityType: CacheEntityType
  entityId: string
}): Promise<void> {
  const { entityType, entityId } = options
  await db.entityCache.delete(cacheKey(entityType, entityId))
}

export async function clearProcessedEntityCacheForEntities(options: {
  entityType: CacheEntityType
  entityIds: string[]
}): Promise<void> {
  const { entityType, entityIds } = options
  await db.entityCache.bulkDelete(entityIds.map((id) => cacheKey(entityType, id)))
}
