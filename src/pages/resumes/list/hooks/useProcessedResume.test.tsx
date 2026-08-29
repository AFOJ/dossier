import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createResume, updateResume } from '@/db/resume'
import { db } from '@/db/db'
import type { Resume } from '@/db/db'
import { processResume } from '@/lib/api'
import { useProcessedResume } from '@/pages/resumes/list/hooks/useProcessedResume'

vi.mock('@/lib/api', () => ({
  ApiError: class ApiError extends Error {
    code: string
    constructor(code: string, message: string) {
      super(message)
      this.code = code
    }
  },
  processResume: vi.fn(),
}))

const mockProcessResume = vi.mocked(processResume)

const PDF = () => new Blob(['%PDF-fake'], { type: 'application/pdf' })

async function makeResume(): Promise<Resume> {
  const id = await createResume('Frontend Engineer', [
    { type: 'paragraph', title: 'Summary', text: 'Summary' },
  ])
  return (await db.resumes.get(id))!
}

beforeEach(async () => {
  vi.clearAllMocks()
  await db.profiles.clear()
  await db.resumes.clear()
  await db.resumeCache.clear()

  mockProcessResume.mockImplementation(() => Promise.resolve(PDF()))
})

describe('useProcessedResume', () => {
  it('processes the resume on mount and exposes a preview URL', async () => {
    const resume = await makeResume()

    const { result } = renderHook(() => useProcessedResume(resume))

    expect(result.current.status).toBe('loading')

    await waitFor(() => {
      expect(result.current.status).toBe('ready')
    })

    expect(mockProcessResume).toHaveBeenCalledTimes(1)
    expect(result.current.url).toMatch(/^blob:/)
    expect(result.current.processedAt).toBeInstanceOf(Date)
  })

  it('serves subsequent mounts from the cache without refetching', async () => {
    const resume = await makeResume()

    const first = renderHook(() => useProcessedResume(resume))
    await waitFor(() => expect(first.result.current.status).toBe('ready'))
    first.unmount()

    const second = renderHook(() => useProcessedResume(resume))
    await waitFor(() => expect(second.result.current.status).toBe('ready'))

    expect(mockProcessResume).toHaveBeenCalledTimes(1)
  }, 20_000)

  it('refetches when the cached copy has expired', async () => {
    const { RESUME_CACHE_TTL_MS } = await import('@/db/resumeCache')
    const resume = await makeResume()

    // Seed an already-expired cache entry.
    await db.resumeCache.put({
      resumeId: resume.id!,
      data: await PDF().arrayBuffer(),
      contentType: 'application/pdf',
      processedAt: new Date(Date.now() - RESUME_CACHE_TTL_MS - 5_000),
      expiresAt: new Date(Date.now() - 1_000),
    })

    const { result } = renderHook(() => useProcessedResume(resume))

    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(mockProcessResume).toHaveBeenCalledTimes(1)
  }, 20_000)

  it('refetches after the resume is updated (cache invalidated)', async () => {
    const resume = await makeResume()

    const first = renderHook(() => useProcessedResume(resume))
    await waitFor(() => expect(first.result.current.status).toBe('ready'))
    first.unmount()

    await updateResume(resume.id!, {
      sections: [{ type: 'paragraph', title: 'Updated', text: 'Updated' }],
    })
    const updated = (await db.resumes.get(resume.id!))!

    const second = renderHook(() => useProcessedResume(updated))
    await waitFor(() => expect(second.result.current.status).toBe('ready'))

    expect(mockProcessResume).toHaveBeenCalledTimes(2)
  }, 20_000)

  it('reports errors from processing and recovers via retry', async () => {
    mockProcessResume.mockRejectedValueOnce(
      new Error('Something went wrong while preparing the resume.'),
    )

    const resume = await makeResume()
    const { result } = renderHook(() => useProcessedResume(resume))

    await waitFor(() => expect(result.current.status).toBe('error'))
    expect(result.current.error?.message).toContain('Something went wrong')

    // Retry (same path as the download action) recovers.
    mockProcessResume.mockResolvedValueOnce(PDF())
    await result.current.download()

    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(mockProcessResume).toHaveBeenCalledTimes(2)
  }, 20_000)
})
