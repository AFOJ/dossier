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
