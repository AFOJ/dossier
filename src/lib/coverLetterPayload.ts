import { getProfile } from "@/db/profile"
import type { CoverLetter } from "@/db/db"

export interface CoverLetterPayloadLink {
  label: string
  url: string
}

export interface CoverLetterPayloadContact {
  full_name: string
  role?: string
  email?: string
  phone?: string
  location?: string
}

export interface CoverLetterPayload {
  title: string
  subject?: string
  signoff?: string
  body: string
  contact?: CoverLetterPayloadContact
}

export async function toCoverLetterPayload(letter: CoverLetter): Promise<CoverLetterPayload> {
  const contact =
    letter.syncProfile === false
      ? letter.contact
      : ((await getProfile()) ?? letter.contact)

  return {
    title: letter.title.trim(),
    subject: letter.subject ?? undefined,
    signoff: letter.signoff ?? undefined,
    body: letter.body,
    contact: toContactPayload(contact),
  }
}

function toContactPayload(contact: CoverLetter["contact"]): CoverLetterPayloadContact | undefined {
  if (!contact) {
    return undefined
  }

  const fullName = contact.full_name.trim()
  if (!fullName) {
    return undefined
  }

  const payload: CoverLetterPayloadContact = { full_name: fullName }

  const role = cleanOptional(contact.role)
  const email = cleanOptional(contact.email)
  const phone = cleanOptional(contact.phone)
  const location = cleanOptional(contact.location)

  if (role) {
    payload.role = role
  }
  if (email) {
    payload.email = email
  }
  if (phone) {
    payload.phone = phone
  }
  if (location) {
    payload.location = location
  }

  return payload
}

function cleanOptional(value: string | null | undefined): string | undefined {
  if (!value) {
    return undefined
  }
  const trimmed = value.trim()
  if (trimmed.length < 1) {
    return undefined
  }
  return trimmed
}