import 'fake-indexeddb/auto'
import { renderHook, act, waitFor } from '@testing-library/react'
import { beforeEach, describe, it, expect } from 'vitest'
import { useResumeTable } from '@/hooks/useResumeTable'
import { db } from '@/db/db'
import { createResume } from '@/db/resume'

const delay = (ms = 5) => new Promise((resolve) => setTimeout(resolve, ms))

beforeEach(async () => {
  await db.resumes.clear()
})

async function seedResumes(titles: string[]) {
  for (const title of titles) {
    await createResume(title, [])
    await delay()
  }
}

describe('useResumeTable', () => {
  it('paginates with only the page slice loaded', async () => {
    await seedResumes(Array.from({ length: 12 }, (_, i) => `Resume ${i}`))

    const { result } = renderHook(() => useResumeTable())

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.pageItems).toHaveLength(10)
    expect(result.current.totalCount).toBe(12)
    expect(result.current.totalPages).toBe(2)
    expect(result.current.page).toBe(1)

    act(() => result.current.setPerPage(2))
    await waitFor(() => expect(result.current.pageItems).toHaveLength(2))
    expect(result.current.totalPages).toBe(6)
    expect(result.current.page).toBe(1)
  })

  it('filters by query and resets the page', async () => {
    await seedResumes([
      'Frontend Engineer',
      'Backend Engineer',
      'Product Designer',
    ])

    const { result } = renderHook(() => useResumeTable())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    act(() => result.current.setQuery('engineer'))
    await waitFor(() => expect(result.current.totalCount).toBe(2))
    expect(result.current.page).toBe(1)
    expect(result.current.pageItems?.map((r) => r.title).sort()).toEqual([
      'Backend Engineer',
      'Frontend Engineer',
    ])
  })

  it('returns newest-updated-first', async () => {
    await createResume('Old', [])
    await delay(10)
    await createResume('New', [])

    const { result } = renderHook(() => useResumeTable())

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.pageItems?.map((r) => r.title)).toEqual([
      'New',
      'Old',
    ])
  })

  it('clamps an out-of-range page to the last page', async () => {
    await seedResumes(Array.from({ length: 5 }, (_, i) => `Resume ${i}`))

    const { result } = renderHook(() => useResumeTable())

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    act(() => result.current.setPerPage(2))
    act(() => result.current.setPage(99))
    await waitFor(() => expect(result.current.page).toBe(3))
    expect(result.current.totalPages).toBe(3)
    expect(result.current.pageItems).toHaveLength(1)
  })

  it('debounces clearing the query until the unfiltered results are ready', async () => {
    await seedResumes(['Resume 0'])

    const { result } = renderHook(() => useResumeTable())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    act(() => result.current.setQuery('Resume 0'))
    expect(result.current.query).toBe('Resume 0')
    await waitFor(() => expect(result.current.resultQuery).toBe('Resume 0'))
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    act(() => result.current.setQuery(''))
    expect(result.current.query).toBe('')
    expect(result.current.resultQuery).toBe('Resume 0')
    expect(result.current.isSearchPending).toBe(true)

    await waitFor(() => expect(result.current.resultQuery).toBe(''))
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.pageItems?.map((resume) => resume.title)).toEqual([
      'Resume 0',
    ])
  })
})
