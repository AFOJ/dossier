import { useCallback, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { queryResumes } from '@/db/resume'
import { DEFAULT_PAGE_SIZE, getPageMetadata, toPositiveInteger } from '@/lib/pagination'

const DEFAULT_PAGE = 1

function readPositiveInteger(value: string | null, fallback: number) {
  return toPositiveInteger(Number(value), fallback)
}

export function useResumeTable() {
  const [searchParams, setSearchParams] = useSearchParams()

  const query = searchParams.get('query') ?? ''
  const requestedPage = readPositiveInteger(searchParams.get('page'), DEFAULT_PAGE)
  const requestedPerPage = readPositiveInteger(searchParams.get('perPage'), DEFAULT_PAGE_SIZE)

  const result = useLiveQuery(
    () => queryResumes({ query, page: requestedPage, perPage: requestedPerPage }),
    [query, requestedPage, requestedPerPage],
  )

  const isLoading = result === undefined
  const pagination = result?.pagination ?? getPageMetadata(0, {
    page: requestedPage,
    perPage: requestedPerPage,
  })

  const updateParams = useCallback(
    (updates: Record<string, string | null>, replace = false) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          for (const [key, value] of Object.entries(updates)) {
            if (value === null) {
              next.delete(key)
            } else {
              next.set(key, value)
            }
          }
          return next
        },
        { replace },
      )
    },
    [setSearchParams],
  )

  useEffect(() => {
    if (result && requestedPage !== pagination.page) {
      updateParams({ page: String(pagination.page) }, true)
    }
  }, [pagination.page, requestedPage, result, updateParams])

  const setQuery = useCallback(
    (value: string) => {
      const trimmed = value.trim()
      updateParams({ query: trimmed === '' ? null : trimmed, page: null }, true)
    },
    [updateParams],
  )

  const setPage = useCallback(
    (value: number) => {
      updateParams({ page: String(value) })
    },
    [updateParams],
  )

  const setPerPage = useCallback(
    (value: number) => {
      updateParams({ perPage: String(value), page: null })
    },
    [updateParams],
  )

  return {
    query,
    setQuery,
    page: pagination.page,
    setPage,
    perPage: pagination.perPage,
    setPerPage,
    totalCount: pagination.totalCount,
    totalPages: pagination.totalPages,
    pageItems: result?.items,
    isLoading,
  }
}
