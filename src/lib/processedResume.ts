import type { Resume } from '@/db/db'
import {
  entryToBlob,
  getValidProcessedResume,
  saveProcessedResume,
} from '@/db/resumeCache'
import { processResume } from '@/lib/api'
import { toResumePayload } from '@/lib/resumePayload'
import { slugify } from '@/utils'

export interface ProcessedResume {
  blob: Blob
  processedAt: Date
}

/**
 * Returns the PDF rendering of a resume: served from the IndexedDB cache
 * while the entry is fresh and newer than the resume's last update,
 * otherwise rendered by the backend and cached with a fresh timestamp.
 * Errors (ApiError included) propagate to the caller.
 */
export async function ensureProcessedResume(
  resume: Resume,
): Promise<ProcessedResume> {
  const cached = await getValidProcessedResume(resume.id!, resume.updatedAt)

  if (cached) {
    return { blob: entryToBlob(cached), processedAt: cached.processedAt }
  }

  const blob = await processResume(await toResumePayload(resume))
  const processedAt = new Date()
  await saveProcessedResume(resume.id!, blob, { processedAt })

  return { blob, processedAt }
}

export function getProcessedResumeFilename(title: string): string {
  return `${slugify(title) || 'resume'}-resume.pdf`
}
