import { db, type Resume, type Tag } from "@/db/db"
import { clearProcessedEntityCache } from "@/db/entityCache"
import { normaliseTagIds, sortTags } from "@/db/tag"
import type { ResumeSection } from "@/db/types"
import { DEFAULT_PAGE_SIZE, getPageMetadata, type PaginationInput } from "@/lib/pagination"

const RESUME_TABLE = db.resumes

export type ResumeQueryItem = Resume & { tags: Tag[] }

type ResumeQueryResult = {
  items: ResumeQueryItem[]
  pagination: ReturnType<typeof getPageMetadata>
}

export async function queryResumes(
  options: { query: string } & PaginationInput,
): Promise<ResumeQueryResult> {
  const query = options.query.trim().toLowerCase()
  const requestedPagination = {
    page: options.page ?? 1,
    perPage: options.perPage ?? DEFAULT_PAGE_SIZE,
  }
  let collection = RESUME_TABLE.orderBy("updatedAt").reverse()

  if (query) {
    collection = collection.filter((resume) => resume.title.toLowerCase().includes(query))
  }

  return db.transaction("r", RESUME_TABLE, db.tags, async () => {
    const totalCount = await collection.count()
    const pagination = getPageMetadata(totalCount, requestedPagination)
    const rows = await collection
      .offset((pagination.page - 1) * pagination.perPage)
      .limit(pagination.perPage)
      .toArray()
    const tagIds = [...new Set(rows.flatMap((resume) => normaliseTagIds(resume.tagIds)))]
    const tags = await db.tags.bulkGet(tagIds)
    const tagsById = new Map(
      tags
        .filter((tag): tag is Tag & { id: number } => tag?.id !== undefined)
        .map((tag) => [tag.id, tag]),
    )
    const items = rows.map((resume) => {
      const tagIds = normaliseTagIds(resume.tagIds)
      return {
        ...resume,
        tagIds,
        tags: sortTags(
          tagIds.flatMap((tagId) => (tagsById.has(tagId) ? [tagsById.get(tagId)!] : [])),
        ),
      }
    })

    return { items, pagination }
  })
}

export interface CreateResumeOptions {
  id?: string
  tagIds?: number[]
  syncProfile?: boolean
  contact?: Resume["contact"]
}

export async function createResume(
  title: string,
  sections: ResumeSection[],
  options: CreateResumeOptions = {},
): Promise<string> {
  const id = options.id ?? crypto.randomUUID()
  const now = new Date()

  await RESUME_TABLE.add({
    id,
    title,
    sections,
    tagIds: normaliseTagIds(options.tagIds),
    createdAt: now,
    updatedAt: now,
    syncProfile: options.syncProfile ?? true,
    contact: options.contact ?? null,
  })

  return id
}

export async function getResume(id: string): Promise<Resume | undefined> {
  const resume = await RESUME_TABLE.get(id)
  return resume ? { ...resume, tagIds: normaliseTagIds(resume.tagIds) } : undefined
}

export async function getAllResumes(): Promise<Resume[]> {
  const resumes = await RESUME_TABLE.orderBy("updatedAt").reverse().toArray()
  return resumes.map((resume) => ({ ...resume, tagIds: normaliseTagIds(resume.tagIds) }))
}

export async function updateResume(
  id: string,
  changes: Partial<Pick<Resume, "title" | "sections" | "tagIds" | "syncProfile" | "contact">>,
): Promise<void> {
  await db.transaction("rw", RESUME_TABLE, db.entityCache, async () => {
    await RESUME_TABLE.update(id, {
      ...changes,
      ...(changes.tagIds === undefined ? {} : { tagIds: normaliseTagIds(changes.tagIds) }),
      updatedAt: new Date(),
    })
    await clearProcessedEntityCache({ entityType: "resume", entityId: id })
  })
}

export async function deleteResume(id: string): Promise<void> {
  await RESUME_TABLE.delete(id)
  try {
    await clearProcessedEntityCache({ entityType: "resume", entityId: id })
  } catch (error) {
    console.error("Failed to clear resume cache:", error)
  }
}
