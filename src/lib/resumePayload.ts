import type { Resume } from '@/db/db'
import { getProfile } from '@/db/profile'
import type {
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

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

function formatMonthYear(date: string | undefined): string | undefined {
  if (!date) return undefined
  const [year, month] = date.split('-')
  const monthIndex = parseInt(month, 10) - 1
  if (!year || monthIndex < 0 || monthIndex >= MONTHS.length) {
    return undefined
  }
  return `${MONTHS[monthIndex]} ${year}`
}

function cleanOptional(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
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
        institutions: section.institutions.map((inst) => ({
          name: inst.name.trim(),
          degree: inst.degree.trim(),
          grade: cleanOptional(inst.grade),
          start_date: cleanOptional(inst.start_date),
          end_date: cleanOptional(inst.end_date),
          location: cleanOptional(inst.location),
          paragraph: cleanOptional(inst.paragraph),
        })),
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
        companies: section.companies.map((company) => {
          const startDate = formatMonthYear(cleanOptional(company.start_date))
          const companyEndDate =
            company.end_date === undefined && !!company.start_date
              ? 'Present'
              : (formatMonthYear(cleanOptional(company.end_date)) ?? null)
          return {
            company_name: company.company_name.trim(),
            company_website: cleanOptional(company.company_website),
            start_date: startDate,
            end_date: companyEndDate,
            roles: company.roles.map((role) => ({
              job_title: role.job_title.trim(),
              employment_type: cleanOptional(role.employment_type),
              location: cleanOptional(role.location),
              start_date: formatMonthYear(cleanOptional(role.start_date)),
              end_date:
                role.end_date === undefined && !!role.start_date
                  ? 'Present'
                  : formatMonthYear(cleanOptional(role.end_date)),
              bullets: role.bullets.map((bullet) =>
                bullet.type === 'text'
                  ? { type: bullet.type, text: bullet.text }
                  : {
                      type: bullet.type,
                      title: bullet.title,
                      text: bullet.text,
                    },
              ),
            })),
          }
        }),
      }
    }
  }
}

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
