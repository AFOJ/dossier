import type { Resume } from "@/db/db"
import { db } from "@/db/db"
import { entryToBlob, getValidProcessedEntity, saveProcessedEntity } from "@/db/entityCache"
import { processResume } from "@/lib/api"
import { toResumePayload } from "@/lib/resumePayload"
import { slugify } from "@/utils"

export interface ProcessedResume {
  blob: Blob
  processedAt: Date
}

export async function ensureProcessedResume(resume: Resume): Promise<ProcessedResume> {
  const cached = await getValidProcessedEntity({
    entityType: "resume",
    entityId: resume.id!,
    entityUpdatedAt: resume.updatedAt,
  })

  if (cached) {
    return { blob: entryToBlob(cached), processedAt: cached.processedAt }
  }

  const expectedUpdatedAt = resume.updatedAt
  const blob = await processResume(await toResumePayload(resume))

  const currentResume = await db.resumes.get(resume.id!)
  if (!currentResume || currentResume.updatedAt.getTime() !== expectedUpdatedAt.getTime()) {
    throw new Error("Resume was modified during PDF generation")
  }

  const processedAt = new Date()
  await saveProcessedEntity({
    entityType: "resume",
    entityId: resume.id!,
    blob,
    processedAt,
  })

  return { blob, processedAt }
}

export function getProcessedResumeFilename(title: string): string {
  return `${slugify(title) || "resume"}-resume.pdf`
}
