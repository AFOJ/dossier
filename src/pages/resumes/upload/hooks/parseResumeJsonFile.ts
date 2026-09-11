import { z } from "zod"
import type { Resume } from "@/db/db"
import { resumeSchema, resumePayloadSchema } from "@/db/schemas"

export interface ParsedResumeResult {
  resume: Resume
  resumeId: string
}

export type ParseResumeResult =
  { success: true; resume: Resume; resumeId: string } | { success: false; error: string }

function convertPayloadToResume(
  payload: z.infer<typeof resumePayloadSchema>,
  resumeId: string,
): Resume {
  const now = new Date()
  const contact = payload.contact
    ? {
        full_name: payload.contact.full_name,
        role: payload.contact.role ?? null,
        email: payload.contact.email ?? null,
        phone: payload.contact.phone ?? null,
        location: payload.contact.location ?? null,
        links: payload.contact.links ?? [],
      }
    : null
  return {
    id: resumeId,
    title: payload.title,
    sections: payload.sections as Resume["sections"],
    createdAt: now,
    updatedAt: now,
    // Payloads carry no sync flag. Freeze an imported contact (unsynced)
    // so it isn't silently replaced by the live profile on next export.
    syncProfile: contact ? false : true,
    contact,
  }
}

function toResumeWithDates(validResume: z.infer<typeof resumeSchema>): Resume {
  const contact = validResume.contact
    ? {
        full_name: validResume.contact.full_name,
        role: validResume.contact.role ?? null,
        email: validResume.contact.email ?? null,
        phone: validResume.contact.phone ?? null,
        location: validResume.contact.location ?? null,
        links: validResume.contact.links ?? [],
      }
    : null
  return {
    ...validResume,
    createdAt: validResume.createdAt ? new Date(validResume.createdAt) : new Date(),
    updatedAt: validResume.updatedAt ? new Date(validResume.updatedAt) : new Date(),
    // Preserve an explicit sync flag. When the flag is missing (older
    // exports), infer from contact so an unsynced contact isn't flipped
    // to synced on upload.
    syncProfile: validResume.syncProfile ?? (contact ? false : true),
    contact,
  }
}

function firstValidationMessage(error: z.ZodError): string {
  const flat = error.flatten()
  const formError = flat.formErrors[0]
  if (formError) {
    return formError
  }
  for (const messages of Object.values(flat.fieldErrors)) {
    const message = messages?.[0]
    if (message) {
      return message
    }
  }
  return "Invalid resume data."
}

/**
 * Parses resume JSON from raw text (file contents or ZIP entry).
 * Returns a discriminated result so batch imports can report per-file
 * errors and skip invalid entries without aborting the whole batch.
 */
export function parseResumeJsonText(text: string, fileName: string): ParseResumeResult {
  let parsedData: unknown
  try {
    parsedData = JSON.parse(text)
  } catch (error) {
    console.error("[parseResumeJsonText] JSON parse error", { fileName, error })
    return { success: false, error: "File is not valid JSON." }
  }

  if (!parsedData || typeof parsedData !== "object" || Array.isArray(parsedData)) {
    console.error("[parseResumeJsonText] Root is not an object", { fileName })
    return { success: false, error: "File does not contain a resume object." }
  }

  const hasId = "id" in parsedData && typeof (parsedData as Record<string, unknown>).id === "string"

  if (hasId) {
    const validationResult = resumeSchema.safeParse(parsedData)
    if (!validationResult.success) {
      console.error("[parseResumeJsonText] Resume validation failed", {
        fileName,
        error: validationResult.error.flatten(),
      })
      return {
        success: false,
        error: `Invalid resume: ${firstValidationMessage(validationResult.error)}`,
      }
    }
    const validResume = validationResult.data
    const resume = toResumeWithDates(validResume)
    const resumeId = validResume.id ?? crypto.randomUUID()
    if (!validResume.id) {
      resume.id = resumeId
    }
    return { success: true, resume, resumeId }
  }

  const validationResult = resumePayloadSchema.safeParse(parsedData)
  if (!validationResult.success) {
    console.error("[parseResumeJsonText] ResumePayload validation failed", {
      fileName,
      error: validationResult.error.flatten(),
    })
    return {
      success: false,
      error: `Invalid resume: ${firstValidationMessage(validationResult.error)}`,
    }
  }
  const resumeId = crypto.randomUUID()
  return {
    success: true,
    resume: convertPayloadToResume(validationResult.data, resumeId),
    resumeId,
  }
}

export async function parseResumeJsonFile(file: File): Promise<ParsedResumeResult | null> {
  if (!file.name.toLowerCase().endsWith(".json") && file.type !== "application/json") {
    console.error("[parseResumeJsonFile] Not a JSON file", {
      fileName: file.name,
      fileType: file.type,
    })
    return null
  }

  const result = parseResumeJsonText(await file.text(), file.name)
  if (!result.success) {
    return null
  }
  return { resume: result.resume, resumeId: result.resumeId }
}
