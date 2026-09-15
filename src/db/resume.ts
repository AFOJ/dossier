import { db, type Resume } from "@/db/db"
import { clearProcessedEntityCache } from "@/db/entityCache"
import type { ResumeSection } from "@/db/types"
import { DEFAULT_PAGE_SIZE, getPageMetadata, type PaginationInput } from "@/lib/pagination"

const RESUME_TABLE = db.resumes

type ResumeQueryResult = {
  items: Resume[]
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
  const collection = query
    ? RESUME_TABLE.orderBy("updatedAt")
        .reverse()
        .filter((resume) => resume.title.toLowerCase().includes(query))
    : RESUME_TABLE.orderBy("updatedAt").reverse()

  return db.transaction("r", RESUME_TABLE, async () => {
    const totalCount = await collection.count()
    const pagination = getPageMetadata(totalCount, requestedPagination)
    const items = await collection
      .offset((pagination.page - 1) * pagination.perPage)
      .limit(pagination.perPage)
      .toArray()

    return { items, pagination }
  })
}

export interface CreateResumeOptions {
  id?: string
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
    createdAt: now,
    updatedAt: now,
    syncProfile: options.syncProfile ?? true,
    contact: options.contact ?? null,
  })

  return id
}

export async function getResume(id: string): Promise<Resume | undefined> {
  return RESUME_TABLE.get(id)
}

export async function getAllResumes(): Promise<Resume[]> {
  return RESUME_TABLE.orderBy("updatedAt").reverse().toArray()
}

export async function updateResume(
  id: string,
  changes: Partial<Pick<Resume, "title" | "sections" | "syncProfile" | "contact">>,
): Promise<void> {
  await RESUME_TABLE.update(id, {
    ...changes,
    updatedAt: new Date(),
  })
  try {
    await clearProcessedEntityCache({ entityType: "resume", entityId: id })
  } catch (error) {
    console.error("Failed to clear resume cache:", error)
  }
}

export async function deleteResume(id: string): Promise<void> {
  await RESUME_TABLE.delete(id)
  try {
    await clearProcessedEntityCache({ entityType: "resume", entityId: id })
  } catch (error) {
    console.error("Failed to clear resume cache:", error)
  }
}
