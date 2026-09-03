import { z } from 'zod'
import type { Resume } from '@/db/db'
import { resumeSchema, resumePayloadSchema } from '@/db/schemas'

interface ParsedResumeResult {
  resume: Resume
  resumeId: string
}

function convertPayloadToResume(payload: z.infer<typeof resumePayloadSchema>, resumeId: string): Resume {
  const now = new Date()
  return {
    id: resumeId,
    title: payload.title,
    sections: payload.sections as Resume['sections'],
    createdAt: now,
    updatedAt: now,
    syncProfile: true,
    contact: payload.contact
      ? {
          full_name: payload.contact.full_name,
          role: payload.contact.role ?? null,
          email: payload.contact.email ?? null,
          phone: payload.contact.phone ?? null,
          location: payload.contact.location ?? null,
          links: payload.contact.links ?? [],
        }
      : null,
  }
}

function toResumeWithDates(validResume: z.infer<typeof resumeSchema>): Resume {
  return {
    ...validResume,
    createdAt: validResume.createdAt ? new Date(validResume.createdAt) : new Date(),
    updatedAt: validResume.updatedAt ? new Date(validResume.updatedAt) : new Date(),
    contact: validResume.contact
      ? {
          full_name: validResume.contact.full_name,
          role: validResume.contact.role ?? null,
          email: validResume.contact.email ?? null,
          phone: validResume.contact.phone ?? null,
          location: validResume.contact.location ?? null,
          links: validResume.contact.links ?? [],
        }
      : null,
  }
}

export async function parseResumeJsonFile(file: File): Promise<ParsedResumeResult | null> {
  if (!file.name.endsWith('.json') && file.type !== 'application/json') {
    console.error('[parseResumeJsonFile] Not a JSON file', { fileName: file.name, fileType: file.type })
    return null
  }

  let parsedData: unknown
  try {
    parsedData = JSON.parse(await file.text())
  } catch (error) {
    console.error('[parseResumeJsonFile] JSON parse error', { fileName: file.name, error })
    return null
  }

  if (!parsedData || typeof parsedData !== 'object') {
    console.error('[parseResumeJsonFile] Root is not an object', { fileName: file.name })
    return null
  }

  const hasId = 'id' in parsedData && typeof (parsedData as Record<string, unknown>).id === 'string'

  let resume: Resume
  let resumeId: string

  if (hasId) {
    const validationResult = resumeSchema.safeParse(parsedData)
    if (!validationResult.success) {
      console.error('[parseResumeJsonFile] Resume validation failed', {
        fileName: file.name,
        error: validationResult.error.flatten(),
      })
      return null
    }
    const validResume = validationResult.data
    resume = toResumeWithDates(validResume)
    resumeId = validResume.id ?? crypto.randomUUID()
    if (!validResume.id) resume.id = resumeId
  } else {
    const validationResult = resumePayloadSchema.safeParse(parsedData)
    if (!validationResult.success) {
      console.error('[parseResumeJsonFile] ResumePayload validation failed', {
        fileName: file.name,
        error: validationResult.error.flatten(),
      })
      return null
    }
    resumeId = crypto.randomUUID()
    resume = convertPayloadToResume(validationResult.data, resumeId)
  }

  return { resume, resumeId }
}