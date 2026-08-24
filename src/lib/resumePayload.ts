import type { Resume } from '@/db/db'
import { getProfile } from '@/db/profile'
import type {
  EducationalInstitution,
  ExperienceCompanyRoleBullet,
  ResumeSection,
  SkillGroup,
} from '@/db/types'

export interface ResumePayloadLink {
  label: string
  url: string
}

export interface ResumePayloadContact {
  full_name: string
  role?: string
  email?: string
  phone?: string
  location?: string
  links?: ResumePayloadLink[]
}

interface WithOptionalTitle {
  title?: string
}

export interface ResumePayloadExperienceRole {
  job_title: string
  employment_type?: string
  location?: string
  start_date?: string
  end_date?: string
  bullets: ExperienceCompanyRoleBullet[]
}

export interface ResumePayloadInstitution {
  name: string
  degree: string
  grade?: string
  start_date?: string
  end_date?: string
  location?: string
  paragraph?: string
}

export interface ResumePayloadExperienceCompany {
  company_name: string
  company_website?: string
  start_date?: string
  /** null means "no end date" per the backend contract. */
  end_date: string | null
  roles: ResumePayloadExperienceRole[]
}

export type ResumePayloadSection =
  | ({ type: 'paragraph'; text: string } & WithOptionalTitle)
  | ({
      type: 'education'
      institutions: ResumePayloadInstitution[]
    } & WithOptionalTitle)
  | ({ type: 'skills'; groups: SkillGroup[] } & WithOptionalTitle)
  | ({
      type: 'experience'
      companies: ResumePayloadExperienceCompany[]
    } & WithOptionalTitle)

export interface ResumePayload {
  title: string
  contact?: ResumePayloadContact
  sections: ResumePayloadSection[]
}

/**
 * Maps a locally stored resume to the backend process contract
 *
 */
export async function toResumePayload(resume: Resume): Promise<ResumePayload> {
  const contact =
    resume.syncProfile === false
      ? resume.contact
      : ((await getProfile()) ?? resume.contact)

  return {
    title: resume.title.trim(),
    contact: toContactPayload(contact),
    sections: resume.sections.map(toSectionPayload),
  }
}

function toContactPayload(
  contact: Resume['contact'],
): ResumePayloadContact | undefined {
  if (!contact) {
    return undefined
  }

  const fullName = contact.full_name.trim()
  if (!fullName) {
    return undefined
  }

  const payload: ResumePayloadContact = { full_name: fullName }

  const role = cleanOptional(contact.role)
  const email = cleanOptional(contact.email)
  const phone = cleanOptional(contact.phone)
  const location = cleanOptional(contact.location)

  if (role) payload.role = role
  if (email) payload.email = email
  if (phone) payload.phone = phone
  if (location) payload.location = location

  const links = (contact.links ?? [])
    .map((link) => ({ label: link.label.trim(), url: link.url.trim() }))
    .filter((link) => link.label && link.url)

  if (links.length > 0) {
    payload.links = links
  }

  return payload
}

function toSectionPayload(section: ResumeSection): ResumePayloadSection {
  switch (section.type) {
    case 'paragraph': {
      return {
        ...cleanTitle(section),
        type: 'paragraph',
        text: section.text,
      }
    }
    case 'education': {
      return {
        ...cleanTitle(section),
        type: 'education',
        institutions: section.institutions.map(toInstitutionPayload),
      }
    }
    case 'skills': {
      return {
        ...cleanTitle(section),
        type: 'skills',
        groups: section.groups
          .map((group) => ({
            title: group.title.trim(),
            items: group.items.map((item) => item.trim()).filter(Boolean),
          }))
          .filter((group) => group.items.length > 0),
      }
    }
    case 'experience': {
      return {
        ...cleanTitle(section),
        type: 'experience',
        companies: section.companies.map((company) => ({
          company_name: company.company_name.trim(),
          company_website: cleanOptional(company.company_website),
          start_date: cleanOptional(company.start_date),
          end_date: cleanOptional(company.end_date) ?? null,
          roles: company.roles.map((role) => ({
            job_title: role.job_title.trim(),
            employment_type: cleanOptional(role.employment_type),
            location: cleanOptional(role.location),
            start_date: cleanOptional(role.start_date),
            end_date: cleanOptional(role.end_date),
            bullets: role.bullets.map((bullet) =>
              bullet.type === 'text'
                ? { type: bullet.type, text: bullet.text }
                : { type: bullet.type, title: bullet.title, text: bullet.text },
            ),
          })),
        })),
      }
    }
  }
}

/**
 * The local model requires start/end/location strings on institutions (but
 * allows them to be empty), while the backend treats them as optional yet
 * non-empty when present — so empties are omitted.
 */
function toInstitutionPayload(
  institution: EducationalInstitution,
): ResumePayloadInstitution {
  return {
    name: institution.name.trim(),
    degree: institution.degree.trim(),
    grade: cleanOptional(institution.grade),
    start_date: cleanOptional(institution.start_date),
    end_date: cleanOptional(institution.end_date),
    location: cleanOptional(institution.location),
    paragraph: cleanOptional(institution.paragraph),
  }
}

/**
 * Sections may carry an optional `title` at runtime (accepted by the zod
 * schema and the backend, but not part of the local TS union), so it is
 * preserved via a presence check.
 */
function cleanTitle(section: ResumeSection): WithOptionalTitle {
  const title = 'title' in section ? section.title : undefined

  if (typeof title === 'string') {
    const cleaned = cleanOptional(title)
    if (cleaned) {
      return { title: cleaned }
    }
  }

  return {}
}

function cleanOptional(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}
