import type {
  SectionErrors,
  ParagraphSectionErrors,
  EducationSectionErrors,
  SkillsSectionErrors,
  ExperienceSectionErrors,
  EducationInstitutionErrors,
  SkillGroupErrors,
  BulletErrors,
  ExperienceRoleErrors,
  ExperienceCompanyErrors,
} from '@/pages/resumes/create/hooks/useCreateResumeForm'
import type { ResumePayload } from '@/lib/resumePayload'

const DEFAULT_API_BASE_URL = 'http://localhost:3000/'

function getApiBaseUrl(): string {
  return (import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL).replace(
    /\/+$/,
    '',
  )
}

export type ApiErrorCode =
  | 'NETWORK_ERROR'
  | 'VALIDATION_ERROR'
  | 'COMPILE_ERROR'
  | 'NOT_FOUND'
  | 'INTERNAL_ERROR'

export type ApiErrorDetail = { path: string; message: string } | string

export class ApiError extends Error {
  code: ApiErrorCode
  details: ApiErrorDetail[]

  constructor(code: ApiErrorCode, message: string, details: ApiErrorDetail[]) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.details = details
  }
}

interface ErrorEnvelope {
  error?: {
    code?: unknown
    message?: unknown
    details?: unknown
  }
}

/**
 * Renders a resume payload to PDF via the backend.
 *
 * POST /api/resumes/process -> application/pdf on success, an error envelope
 * `{ error: { code, message, details } }` for any non-2xx response.
 */
export async function processResume(payload: ResumePayload): Promise<Blob> {
  let response: Response

  try {
    response = await fetch(`${getApiBaseUrl()}/api/resumes/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch {
    throw new ApiError(
      'NETWORK_ERROR',
      'Could not reach the server. Check your connection and try again.',
      [],
    )
  }

  if (!response.ok) {
    throw await toApiError(response)
  }

  return response.blob()
}

async function toApiError(response: Response): Promise<ApiError> {
  let envelope: ErrorEnvelope

  try {
    envelope = (await response.json()) as ErrorEnvelope
  } catch {
    return new ApiError(
      'INTERNAL_ERROR',
      `Unexpected response from the server (${response.status}).`,
      [],
    )
  }

  const code = normalizeCode(envelope.error?.code)
  const message =
    typeof envelope.error?.message === 'string' && envelope.error.message
      ? envelope.error.message
      : `Request failed (${response.status}).`

  const details = Array.isArray(envelope.error?.details)
    ? (envelope.error.details as ApiErrorDetail[])
    : []

  return new ApiError(code, message, details)
}

function normalizeCode(value: unknown): ApiErrorCode {
  if (
    value === 'VALIDATION_ERROR' ||
    value === 'COMPILE_ERROR' ||
    value === 'NOT_FOUND' ||
    value === 'INTERNAL_ERROR'
  ) {
    return value
  }

  return 'INTERNAL_ERROR'
}

/** Formats an ApiError into a single human-readable sentence. */
export function formatApiError(error: ApiError): string {
  const firstDetail = error.details[0]

  if (typeof firstDetail === 'string') {
    return `${error.message} (${firstDetail.trim()})`
  }

  if (firstDetail) {
    return `${error.message} (${firstDetail.path}: ${firstDetail.message})`
  }

  return error.message
}

const MAX_ERROR_LINES = 5

/** Messages emitted while a JSON Schema oneOf tries unrelated variants. */
const CASCADE_MESSAGE =
  /oneOf|additional propert|equal to constant|required property/i

/**
 * Turns error details into short, actionable lines for display.
 *
 * JSON Schema oneOf validators emit misleading cascade noise ("must match
 * exactly one schema", failed attempts on the section root), so those are
 * filtered first; if that leaves nothing, the raw details are shown instead.
 * String details (LaTeX log excerpts) are shown verbatim.
 */
export function getErrorFeedback(error: ApiError): string[] {
  const objectDetails = error.details.filter(
    (detail): detail is { path: string; message: string } =>
      typeof detail === 'object',
  )

  if (objectDetails.length > 0) {
    const lines = collectDetailLines(objectDetails)
    if (lines.length > 0) {
      return lines
    }

    const unfiltered = collectDetailLines(objectDetails, false)
    if (unfiltered.length > 0) {
      return unfiltered
    }
  }

  const stringDetails = error.details.filter(
    (detail): detail is string => typeof detail === 'string',
  )

  if (stringDetails.length > 0) {
    return [stringDetails[0].trim()]
  }

  return [error.message]
}

function collectDetailLines(
  details: { path: string; message: string }[],
  skipCascade = true,
): string[] {
  const lines: string[] = []

  const relevant = skipCascade
    ? details.filter((d) => !CASCADE_MESSAGE.test(d.message))
    : details

  for (const detail of relevant.sort(
    (a, b) => b.path.split('/').length - a.path.split('/').length,
  )) {
    const line = `${detail.path}: ${detail.message}`
    if (!lines.includes(line)) {
      lines.push(line)
    }
    if (lines.length >= MAX_ERROR_LINES) {
      break
    }
  }

  return lines
}

/**
 * Parses flat API validation error details (with JSON pointer paths)
 * into the nested SectionErrors structure expected by the form components.
 *
 * Backend format:
 *   { path: "/sections/0/institutions/1/name", message: "..." }
 *
 * Frontend format:
 *   SectionErrors[] with discriminated union by section type
 */
export function parseApiValidationErrors(
  details: { path: string; message: string }[]
): SectionErrors[] {
  const sections: SectionErrors[] = []

  for (const detail of details) {
    const path = detail.path
    const message = detail.message

    // Parse JSON pointer: /sections/0/institutions/1/name
    const segments = path.split('/').filter(Boolean)
    if (segments[0] !== 'sections') continue

    const sectionIndex = parseInt(segments[1], 10)
    if (isNaN(sectionIndex)) continue

    while (sections.length <= sectionIndex) {
      sections.push({ type: 'paragraph', title: undefined, text: undefined })
    }

    const fieldPath = segments.slice(2) // e.g., ['institutions', '1', 'name']
    const sectionErrors = buildSectionErrors(fieldPath, message)

    // Merge with existing section errors, preserving type if already set
    if (sections[sectionIndex].type === 'paragraph' && !sectionErrors.type) {
      // Keep placeholder type if new errors don't specify type
    } else {
      sections[sectionIndex] = mergeSectionErrors(
        sections[sectionIndex],
        sectionErrors,
      )
    }
  }

  return sections
}

function buildSectionErrors(
  path: string[],
  message: string,
): Partial<SectionErrors> {
  if (path.length === 0) return {}

  const [field, ...rest] = path

  switch (field) {
    case 'title':
      return { title: { message } }

    case 'text':
      return { text: { message } }

    case 'institutions': {
      const index = parseInt(rest[0], 10)
      const subField = rest[1]
      if (isNaN(index) || !subField) return {}

      const institutionErrors: EducationInstitutionErrors = {}
      institutionErrors[subField as keyof EducationInstitutionErrors] = {
        message,
      }

      const arr = Array.from({ length: index + 1 }, (_, i) =>
        i === index ? { ...institutionErrors } : {},
      ) as EducationInstitutionErrors[]
      // Add message property to array for section-level error
      ;(arr as EducationInstitutionErrors[] & { message?: string }).message =
        undefined

      return {
        type: 'education',
        institutions: arr,
      }
    }

    case 'groups': {
      const index = parseInt(rest[0], 10)
      const subField = rest[1]
      if (isNaN(index) || !subField) return {}

      const groupErrors: SkillGroupErrors = {}
      groupErrors[subField as keyof SkillGroupErrors] = { message }

      const arr = Array.from({ length: index + 1 }, (_, i) =>
        i === index ? { ...groupErrors } : {},
      ) as SkillGroupErrors[]
      ;(arr as SkillGroupErrors[] & { message?: string }).message = undefined

      return {
        type: 'skills',
        groups: arr,
      }
    }

    case 'companies': {
      const companyIndex = parseInt(rest[0], 10)
      if (isNaN(companyIndex)) return {}

      const companyField = rest[1]
      if (!companyField) return {}

      // Company-level field (company_name, company_website, start_date, end_date)
      if (!rest[2]) {
        const companyErrors: ExperienceCompanyErrors = {}
        ;(companyErrors as Record<string, { message: string }>)[companyField] = {
          message,
        }

        const arr = Array.from({ length: companyIndex + 1 }, (_, i) =>
          i === companyIndex ? { ...companyErrors } : {},
        ) as ExperienceCompanyErrors[]
        ;(arr as ExperienceCompanyErrors[] & { message?: string }).message =
          undefined

        return {
          type: 'experience',
          companies: arr,
        }
      }

      const roleIndex = parseInt(rest[2], 10)
      if (isNaN(roleIndex)) return {}

      const roleField = rest[3]
      if (!roleField) return {}

      // Role-level field (job_title, employment_type, location, start_date, end_date)
      if (!rest[4]) {
        const roleErrors: ExperienceRoleErrors = {}
        ;(roleErrors as Record<string, { message: string }>)[roleField] = {
          message,
        }

        const rolesArr = Array.from({ length: roleIndex + 1 }, (_, j) =>
          j === roleIndex ? { ...roleErrors } : {},
        ) as ExperienceRoleErrors[]
        ;(rolesArr as ExperienceRoleErrors[] & { message?: string }).message =
          undefined

        const companiesArr = Array.from(
          { length: companyIndex + 1 },
          (_, i) =>
            i === companyIndex
              ? {
                  roles: rolesArr as ExperienceRoleErrors[] & { message?: string },
                  message: undefined,
                }
              : ({} as ExperienceCompanyErrors),
        ) as ExperienceCompanyErrors[]
        ;(companiesArr as ExperienceCompanyErrors[] & {
          message?: string
        }).message = undefined

        return {
          type: 'experience',
          companies: companiesArr,
        }
      }

      const bulletIndex = parseInt(rest[4], 10)
      if (isNaN(bulletIndex)) return {}

      const bulletField = rest[5]
      if (!bulletField) return {}

      const bulletErrors: BulletErrors = {}
      ;(bulletErrors as Record<string, { message: string }>)[bulletField] = {
        message,
      }

      const bulletsArr = Array.from({ length: bulletIndex + 1 }, (_, k) =>
        k === bulletIndex ? { ...bulletErrors } : {},
      ) as BulletErrors[]
      ;(bulletsArr as BulletErrors[] & { message?: string }).message = undefined

      const rolesArr = Array.from({ length: roleIndex + 1 }, (_, j) =>
        j === roleIndex
          ? {
              bullets: bulletsArr as BulletErrors[] & { message?: string },
              message: undefined,
            }
          : ({} as ExperienceRoleErrors),
      ) as ExperienceRoleErrors[]
      ;(rolesArr as ExperienceRoleErrors[] & { message?: string }).message =
        undefined

      const companiesArr = Array.from({ length: companyIndex + 1 }, (_, i) =>
        i === companyIndex
          ? {
              roles: rolesArr as ExperienceRoleErrors[] & { message?: string },
              message: undefined,
            }
          : ({} as ExperienceCompanyErrors),
      ) as ExperienceCompanyErrors[]
      ;(companiesArr as ExperienceCompanyErrors[] & {
        message?: string
      }).message = undefined

      return {
        type: 'experience',
        companies: companiesArr,
      }
    }
  }

  return {}
}

function mergeSectionErrors(
  existing: SectionErrors,
  incoming: Partial<SectionErrors>,
): SectionErrors {
  // If incoming has a type, use it (it's more specific)
  const type = incoming.type ?? existing.type

  // Helper to merge arrays of objects with message
  // Using a simple object type to avoid generic constraint issues
  const mergeArray = (
    existingArr: (Record<string, unknown> & { message?: string })[] | undefined,
    incomingArr: (Record<string, unknown> & { message?: string })[] | undefined,
  ): (Record<string, unknown> & { message?: string })[] | undefined => {
    if (!incomingArr) return existingArr
    if (!existingArr) return incomingArr

    const maxLen = Math.max(existingArr.length, incomingArr.length)
    const result = Array.from({ length: maxLen }, (_, i) => {
      const e = existingArr[i] ?? {}
      const inc = incomingArr[i] ?? {}
      return { ...e, ...inc }
    }) as (Record<string, unknown> & { message?: string })[]

    // Preserve message property on array
    const existingMsg = (existingArr as { message?: string }).message
    const incomingMsg = (incomingArr as { message?: string }).message
    ;(result as { message?: string }).message = incomingMsg ?? existingMsg

    return result
  }

  switch (type) {
    case 'paragraph': {
      const e = existing as ParagraphSectionErrors
      const inc = incoming as Partial<ParagraphSectionErrors>
      return {
        type: 'paragraph',
        title: inc.title ?? e.title,
        text: inc.text ?? e.text,
      }
    }

    case 'education': {
      const e = existing as EducationSectionErrors
      const inc = incoming as Partial<EducationSectionErrors>
      return {
        type: 'education',
        title: inc.title ?? e.title,
        institutions: mergeArray(
          e.institutions as
            | (Record<string, unknown> & { message?: string })[]
            | undefined,
          inc.institutions as
            | (Record<string, unknown> & { message?: string })[]
            | undefined,
        ) as EducationInstitutionErrors[] & { message?: string },
      }
    }

    case 'skills': {
      const e = existing as SkillsSectionErrors
      const inc = incoming as Partial<SkillsSectionErrors>
      return {
        type: 'skills',
        title: inc.title ?? e.title,
        groups: mergeArray(
          e.groups as
            | (Record<string, unknown> & { message?: string })[]
            | undefined,
          inc.groups as
            | (Record<string, unknown> & { message?: string })[]
            | undefined,
        ) as SkillGroupErrors[] & { message?: string },
      }
    }

    case 'experience': {
      const e = existing as ExperienceSectionErrors
      const inc = incoming as Partial<ExperienceSectionErrors>
      return {
        type: 'experience',
        title: inc.title ?? e.title,
        companies: mergeArray(
          e.companies as
            | (Record<string, unknown> & { message?: string })[]
            | undefined,
          inc.companies as
            | (Record<string, unknown> & { message?: string })[]
            | undefined,
        ) as ExperienceCompanyErrors[] & { message?: string },
      }
    }
  }
}
