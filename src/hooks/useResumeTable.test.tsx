import 'fake-indexeddb/auto'
import { renderHook, act, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter, useSearchParams } from 'react-router-dom'
import { beforeEach, describe, it, expect } from 'vitest'
import { useResumeTable } from './useResumeTable'
import { db } from '../db/db'
import { createResume } from '../db/resume'

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

function makeWrapper(initialEntries: string[]) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
    )
  }
}

describe('useResumeTable', () => {
  it('paginates with only the page slice loaded', async () => {
    await seedResumes(Array.from({ length: 12 }, (_, i) => `Resume ${i}`))

    const { result } = renderHook(() => useResumeTable(), {
      wrapper: makeWrapper(['/resumes']),
    })

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

  it('reads page and perPage from the search params', async () => {
    await seedResumes(Array.from({ length: 12 }, (_, i) => `Resume ${i}`))

    const { result } = renderHook(() => useResumeTable(), {
      wrapper: makeWrapper(['/resumes?page=2&perPage=2']),
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.page).toBe(2)
    expect(result.current.perPage).toBe(2)
    expect(result.current.pageItems).toHaveLength(2)
    expect(result.current.pageItems?.[0]?.title).toBe('Resume 9')
  })

  it('filters by query and resets the page', async () => {
    await seedResumes([
      'Frontend Engineer',
      'Backend Engineer',
      'Product Designer',
    ])

    const { result } = renderHook(() => useResumeTable(), {
      wrapper: makeWrapper(['/resumes?page=1&perPage=2']),
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.pageItems).toHaveLength(2)

    act(() => result.current.setQuery('engineer'))
    await waitFor(() => expect(result.current.totalCount).toBe(2))
    expect(result.current.page).toBe(1)
    expect(
      result.current.pageItems?.map((r) => r.title).sort(),
    ).toEqual(['Backend Engineer', 'Frontend Engineer'])
  })

  it('returns newest-updated-first', async () => {
    await createResume('Old', [])
    await delay(10)
    await createResume('New', [])

    const { result } = renderHook(() => useResumeTable(), {
      wrapper: makeWrapper(['/resumes']),
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.pageItems?.map((r) => r.title)).toEqual([
      'New',
      'Old',
    ])
  })

  it('clamps an out-of-range page to the last page', async () => {
    await seedResumes(Array.from({ length: 5 }, (_, i) => `Resume ${i}`))

    const { result } = renderHook(() => useResumeTable(), {
      wrapper: makeWrapper(['/resumes?page=99&perPage=2']),
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.totalPages).toBe(3)
    expect(result.current.page).toBe(3)
    expect(result.current.pageItems).toHaveLength(1)
  })

  it('writes its state to the search params', async () => {
    await seedResumes(['Resume 0'])

    const captured: { params: string } = { params: '' }
    function Probe() {
      const [params] = useSearchParams()
      captured.params = params.toString()
      return null
    }
    function wrapper({ children }: { children: ReactNode }) {
      return (
        <MemoryRouter initialEntries={['/resumes']}>
          <Probe />
          {children}
        </MemoryRouter>
      )
    }

    const { result } = renderHook(() => useResumeTable(), { wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    act(() => result.current.setPerPage(2))
    act(() => result.current.setQuery('Resume 1'))

    expect(captured.params).toContain('perPage=2')
    expect(captured.params).toContain('query=Resume+1')
  })
})