import { db, type CoverLetter } from "@/db/db"
import { DEFAULT_PAGE_SIZE, getPageMetadata, type PaginationInput } from "@/lib/pagination"

const COVER_LETTER_TABLE = db.coverLetters

type CoverLetterQueryResult = {
  items: CoverLetter[]
  pagination: ReturnType<typeof getPageMetadata>
}

export async function queryCoverLetters(
  options: { query: string } & PaginationInput,
): Promise<CoverLetterQueryResult> {
  const normalizedQuery = options.query.trim().toLowerCase()
  const requestedPagination = {
    page: options.page ?? 1,
    perPage: options.perPage ?? DEFAULT_PAGE_SIZE,
  }
  const collection = normalizedQuery
    ? COVER_LETTER_TABLE.orderBy("updatedAt")
        .reverse()
        .filter((letter) => {
          return (
            letter.title.toLowerCase().includes(normalizedQuery) ||
            (letter.subject ?? "").toLowerCase().includes(normalizedQuery)
          )
        })
    : COVER_LETTER_TABLE.orderBy("updatedAt").reverse()

  return db.transaction("r", COVER_LETTER_TABLE, async () => {
    const totalCount = await collection.count()
    const pagination = getPageMetadata(totalCount, requestedPagination)
    const items = await collection
      .offset((pagination.page - 1) * pagination.perPage)
      .limit(pagination.perPage)
      .toArray()

    return { items, pagination }
  })
}

export interface CreateCoverLetterInput {
  title: string
  subject?: string | null
  signoff?: string | null
  body: string
}

export interface CreateCoverLetterOptions {
  id?: string
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
    signoff: input.signoff ?? null,
    body: input.body,
    createdAt: now,
    updatedAt: now,
    syncProfile: options.syncProfile ?? true,
    contact: options.contact ?? null,
  })

  return id
}

export async function getCoverLetter(id: string): Promise<CoverLetter | undefined> {
  return COVER_LETTER_TABLE.get(id)
}

export async function getAllCoverLetters(): Promise<CoverLetter[]> {
  return COVER_LETTER_TABLE.orderBy("updatedAt").reverse().toArray()
}

export async function updateCoverLetter(
  id: string,
  changes: Partial<
    Pick<CoverLetter, "title" | "subject" | "signoff" | "body" | "syncProfile" | "contact">
  >,
): Promise<void> {
  await COVER_LETTER_TABLE.update(id, {
    ...changes,
    updatedAt: new Date(),
  })
}

export async function deleteCoverLetter(id: string): Promise<void> {
  await COVER_LETTER_TABLE.delete(id)
}
