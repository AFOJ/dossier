import { z } from "zod"
import type { CoverLetter } from "@/db/db"
import { coverLetterSchema, coverLetterPayloadSchema } from "@/db/schemas"
import { sanitizeCoverLetterBody } from "@/lib/coverLetterBody"

export interface ParsedCoverLetterResult {
  letter: CoverLetter
  letterId: string
}

export type ParseCoverLetterResult =
  { success: true; letter: CoverLetter; letterId: string } | { success: false; error: string }

function normalizeContact(
  contact: z.infer<typeof coverLetterSchema>["contact"],
): CoverLetter["contact"] {
  if (!contact) {
    return null
  }
  return {
    full_name: contact.full_name,
    role: contact.role ?? null,
    email: contact.email ?? null,
    phone: contact.phone ?? null,
    location: contact.location ?? null,
    links: contact.links ?? [],
  }
}

function convertPayloadToCoverLetter(
  payload: z.infer<typeof coverLetterPayloadSchema>,
  letterId: string,
): CoverLetter {
  const now = new Date()
  const contact = normalizeContact(payload.contact)
  return {
    id: letterId,
    title: payload.title,
    subject: payload.subject ?? null,
    signoff: payload.signoff ?? null,
    body: sanitizeCoverLetterBody(payload.body),
    createdAt: now,
    updatedAt: now,
    syncProfile: contact ? false : true,
    contact,
  }
}

function toCoverLetterWithDates(valid: z.infer<typeof coverLetterSchema>): CoverLetter {
  const contact = normalizeContact(valid.contact)
  return {
    ...valid,
    subject: valid.subject ?? null,
    signoff: valid.signoff ?? null,
    body: sanitizeCoverLetterBody(valid.body),
    createdAt: valid.createdAt ? new Date(valid.createdAt) : new Date(),
    updatedAt: valid.updatedAt ? new Date(valid.updatedAt) : new Date(),
    syncProfile: valid.syncProfile ?? (contact ? false : true),
    contact,
  }
}

function firstValidationMessage(error: z.ZodError): string {
  const firstIssue = error.issues[0]
  if (firstIssue) {
    return firstIssue.message
  }
  return "Invalid cover letter data."
}

export function parseCoverLetterJsonText(text: string, fileName: string): ParseCoverLetterResult {
  let parsedData: unknown
  try {
    parsedData = JSON.parse(text)
  } catch (error) {
    console.error("[parseCoverLetterJsonText] JSON parse error", { fileName, error })
    return { success: false, error: "File is not valid JSON." }
  }

  if (!parsedData || typeof parsedData !== "object" || Array.isArray(parsedData)) {
    console.error("[parseCoverLetterJsonText] Root is not an object", { fileName })
    return { success: false, error: "File does not contain a cover letter object." }
  }

  const hasId = "id" in parsedData && typeof (parsedData as Record<string, unknown>).id === "string"

  if (hasId) {
    const validationResult = coverLetterSchema.safeParse(parsedData)
    if (!validationResult.success) {
      console.error("[parseCoverLetterJsonText] Cover letter validation failed", {
        fileName,
        error: validationResult.error.flatten(),
      })
      return {
        success: false,
        error: `Invalid cover letter: ${firstValidationMessage(validationResult.error)}`,
      }
    }
    const valid = validationResult.data
    const letter = toCoverLetterWithDates(valid)
    const letterId = valid.id ?? crypto.randomUUID()
    if (!valid.id) {
      letter.id = letterId
    }
    return { success: true, letter, letterId }
  }

  const validationResult = coverLetterPayloadSchema.safeParse(parsedData)
  if (!validationResult.success) {
    console.error("[parseCoverLetterJsonText] CoverLetterPayload validation failed", {
      fileName,
      error: validationResult.error.flatten(),
    })
    return {
      success: false,
      error: `Invalid cover letter: ${firstValidationMessage(validationResult.error)}`,
    }
  }
  const letterId = crypto.randomUUID()
  return {
    success: true,
    letter: convertPayloadToCoverLetter(validationResult.data, letterId),
    letterId,
  }
}

export async function parseCoverLetterJsonFile(
  file: File,
): Promise<ParsedCoverLetterResult | null> {
  if (!file.name.toLowerCase().endsWith(".json") && file.type !== "application/json") {
    console.error("[parseCoverLetterJsonFile] Not a JSON file", {
      fileName: file.name,
      fileType: file.type,
    })
    return null
  }

  const result = parseCoverLetterJsonText(await file.text(), file.name)
  if (!result.success) {
    return null
  }
  return { letter: result.letter, letterId: result.letterId }
}
