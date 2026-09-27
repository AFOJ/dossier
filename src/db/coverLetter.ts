import { db, type CoverLetter, type Tag } from "@/db/db"
import { clearProcessedEntityCache } from "@/db/entityCache"
import { normaliseTagIds, sortTags } from "@/db/tag"
import { DEFAULT_PAGE_SIZE, getPageMetadata, type PaginationInput } from "@/lib/pagination"

const COVER_LETTER_TABLE = db.coverLetters

export type CoverLetterQueryItem = CoverLetter & { tags: Tag[] }

type CoverLetterQueryResult = {
  items: CoverLetterQueryItem[]
  pagination: ReturnType<typeof getPageMetadata>
}

export async function queryCoverLetters(
  options: { query: string } & PaginationInput,
): Promise<CoverLetterQueryResult> {
  const normalisedQuery = options.query.trim().toLowerCase()
  const requestedPagination = {
    page: options.page ?? 1,
    perPage: options.perPage ?? DEFAULT_PAGE_SIZE,
  }
  let collection = COVER_LETTER_TABLE.orderBy("updatedAt").reverse()

  if (normalisedQuery) {
    collection = collection.filter((letter) => {
      return (
        letter.title.toLowerCase().includes(normalisedQuery) ||
        (letter.subject ?? "").toLowerCase().includes(normalisedQuery)
      )
    })
  }

  return db.transaction("r", COVER_LETTER_TABLE, db.tags, async () => {
    const totalCount = await collection.count()
    const pagination = getPageMetadata(totalCount, requestedPagination)
    const rows = await collection
      .offset((pagination.page - 1) * pagination.perPage)
      .limit(pagination.perPage)
      .toArray()
    const tagIds = [...new Set(rows.flatMap((coverLetter) => normaliseTagIds(coverLetter.tagIds)))]
    const tags = await db.tags.bulkGet(tagIds)
    const tagsById = new Map(
      tags
        .filter((tag): tag is Tag & { id: number } => tag?.id !== undefined)
        .map((tag) => [tag.id, tag]),
    )
    const items = rows.map((coverLetter) => {
      const tagIds = normaliseTagIds(coverLetter.tagIds)
      return {
        ...coverLetter,
        tagIds,
        tags: sortTags(
          tagIds.flatMap((tagId) => (tagsById.has(tagId) ? [tagsById.get(tagId)!] : [])),
        ),
      }
    })

    return { items, pagination }
  })
}

export interface CreateCoverLetterInput {
  title: string
  subject?: string | null
  date?: string | null
  body: string
}

export interface CreateCoverLetterOptions {
  id?: string
  tagIds?: number[]
  syncProfile?: boolean
  contact?: CoverLetter["contact"]
}

export async function createCoverLetter(
  input: CreateCoverLetterInput,
  options: CreateCoverLetterOptions = {},
): Promise<string> {
  const id = options.id ?? crypto.randomUUID()
  const now = new Date()

  await COVER_LETTER_TABLE.add({
    id,
    title: input.title,
    subject: input.subject ?? null,
    date: input.date ?? null,
    body: input.body,
    tagIds: normaliseTagIds(options.tagIds),
    createdAt: now,
    updatedAt: now,
    syncProfile: options.syncProfile ?? true,
    contact: options.contact ?? null,
  })

  return id
}

export async function getCoverLetter(id: string): Promise<CoverLetter | undefined> {
  const coverLetter = await COVER_LETTER_TABLE.get(id)
  return coverLetter ? { ...coverLetter, tagIds: normaliseTagIds(coverLetter.tagIds) } : undefined
}

export async function getAllCoverLetters(): Promise<CoverLetter[]> {
  const coverLetters = await COVER_LETTER_TABLE.orderBy("updatedAt").reverse().toArray()
  return coverLetters.map((coverLetter) => ({
    ...coverLetter,
    tagIds: normaliseTagIds(coverLetter.tagIds),
  }))
}

export async function updateCoverLetter(
  id: string,
  changes: Partial<
    Pick<CoverLetter, "title" | "subject" | "date" | "body" | "tagIds" | "syncProfile" | "contact">
  >,
): Promise<void> {
  await db.transaction("rw", COVER_LETTER_TABLE, db.entityCache, async () => {
    await COVER_LETTER_TABLE.update(id, {
      ...changes,
      ...(changes.tagIds === undefined ? {} : { tagIds: normaliseTagIds(changes.tagIds) }),
      updatedAt: new Date(),
    })
    await clearProcessedEntityCache({ entityType: "coverLetter", entityId: id })
  })
}

export async function deleteCoverLetter(id: string): Promise<void> {
  await COVER_LETTER_TABLE.delete(id)
  try {
    await clearProcessedEntityCache({ entityType: "coverLetter", entityId: id })
  } catch (error) {
    console.error("Failed to clear cover letter cache:", error)
  }
}
