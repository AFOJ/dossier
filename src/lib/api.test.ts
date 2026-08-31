import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, formatApiError, getErrorFeedback, processResume } from '@/lib/api'

function mockFetchOnce(impl: () => Promise<unknown>) {
  const fetchMock = vi.fn(impl)
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('processResume', () => {
  it('posts the JSON payload and returns the PDF blob', async () => {
    const blob = new Blob(['pdf'], { type: 'application/pdf' })
    const fetchMock = mockFetchOnce(async () => ({
      ok: true,
      blob: () => Promise.resolve(blob),
    }))

    const result = await processResume({
      title: 'Frontend Engineer',
      sections: [],
    })

    expect(result).toBe(blob)
    const baseUrl = (
      import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/'
    ).replace(/\/+$/, '')
    expect(fetchMock).toHaveBeenCalledWith(
      `${baseUrl}/api/resumes/process`,
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Frontend Engineer', sections: [] }),
      }),
    )
  })

  it('throws a validation error with field paths on 400', async () => {
    mockFetchOnce(async () => ({
      ok: false,
      status: 400,
      json: () =>
        Promise.resolve({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request',
            details: [
              { path: '/sections/0/text', message: 'too_small' },
            ],
          },
        }),
    }))

    const error = await processResume({ title: 'x', sections: [] }).catch(
      (cause) => cause,
    )

    expect(error).toBeInstanceOf(ApiError)
    expect(error.code).toBe('VALIDATION_ERROR')
    expect(error.message).toBe('Invalid request')
    expect(error.details).toEqual([
      { path: '/sections/0/text', message: 'too_small' },
    ])
  })

  it('throws a compile error with log excerpts on 422', async () => {
    mockFetchOnce(async () => ({
      ok: false,
      status: 422,
      json: () =>
        Promise.resolve({
          error: {
            code: 'COMPILE_ERROR',
            message: 'LaTeX compilation failed',
            details: ['! Undefined control sequence.'],
          },
        }),
    }))

    const error = await processResume({ title: 'x', sections: [] }).catch(
      (cause) => cause,
    )

    expect(error).toBeInstanceOf(ApiError)
    expect(error.code).toBe('COMPILE_ERROR')
    expect(error.details).toEqual(['! Undefined control sequence.'])
  })

  it('falls back to an internal error when the body is not the envelope', async () => {
    mockFetchOnce(async () => ({
      ok: false,
      status: 502,
      json: () => Promise.reject(new SyntaxError('Unexpected token')),
    }))

    const error = await processResume({ title: 'x', sections: [] }).catch(
      (cause) => cause,
    )

    expect(error).toBeInstanceOf(ApiError)
    expect(error.code).toBe('INTERNAL_ERROR')
    expect(error.details).toEqual([])
  })

  it('wraps network failures in a NETWORK_ERROR', async () => {
    mockFetchOnce(async () => {
      throw new TypeError('Failed to fetch')
    })

    const error = await processResume({ title: 'x', sections: [] }).catch(
      (cause) => cause,
    )

    expect(error).toBeInstanceOf(ApiError)
    expect(error.code).toBe('NETWORK_ERROR')
  })
})

describe('getErrorFeedback', () => {
  it('surfaces leaf paths and drops oneOf cascade noise', () => {
    const error = new ApiError('VALIDATION_ERROR', 'Invalid request', [
      { path: '/sections/2', message: "must have required property 'text'" },
      { path: '/sections/2', message: 'must NOT have additional properties' },
      { path: '/sections/2/type', message: 'must be equal to constant' },
      {
        path: '/sections/2/institutions/0/start_date',
        message: 'must match pattern "\\S"',
      },
      {
        path: '/sections/2/institutions/0/location',
        message: 'must match pattern "\\S"',
      },
      { path: '/sections/2', message: 'must match exactly one schema in oneOf' },
    ])

    expect(getErrorFeedback(error)).toEqual([
      '/sections/2/institutions/0/start_date: must match pattern "\\S"',
      '/sections/2/institutions/0/location: must match pattern "\\S"',
    ])
  })

  it('caps the number of lines shown', () => {
    const details = Array.from({ length: 8 }, (_, i) => ({
      path: `/sections/${i}/text`,
      message: 'too_small',
    }))
    const error = new ApiError('VALIDATION_ERROR', 'Invalid request', details)

    expect(getErrorFeedback(error)).toHaveLength(5)
  })

  it('shows LaTeX log excerpts verbatim for compile errors', () => {
    const error = new ApiError('COMPILE_ERROR', 'Compilation failed', [
      '! Undefined control sequence.\nl.42 \\foo',
    ])

    expect(getErrorFeedback(error)).toEqual([
      '! Undefined control sequence.\nl.42 \\foo',
    ])
  })

  it('falls back to the message when there are no details', () => {
    const error = new ApiError('NETWORK_ERROR', 'No connection', [])

    expect(getErrorFeedback(error)).toEqual(['No connection'])
  })
})

describe('formatApiError', () => {
  it('appends the first object detail as path and message', () => {
    const error = new ApiError('VALIDATION_ERROR', 'Invalid request', [
      { path: '/title', message: 'required' },
    ])

    expect(formatApiError(error)).toBe('Invalid request (/title: required)')
  })

  it('appends string details verbatim', () => {
    const error = new ApiError('COMPILE_ERROR', 'Compilation failed', [
      '! LaTeX Error',
    ])

    expect(formatApiError(error)).toBe('Compilation failed (! LaTeX Error)')
  })

  it('uses just the message when there are no details', () => {
    const error = new ApiError('NETWORK_ERROR', 'No connection', [])

    expect(formatApiError(error)).toBe('No connection')
  })
})
