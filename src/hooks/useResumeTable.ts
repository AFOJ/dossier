import { useCallback, useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/db'
import { queryResumes } from '@/db/resume'
import {
  DEFAULT_PAGE_SIZE,
  getPageMetadata,
  toPositiveInteger,
} from '@/lib/pagination'

const DEFAULT_PAGE = 1
const SEARCH_DEBOUNCE_MS = 250

type ResumeQueryResult = Awaited<ReturnType<typeof queryResumes>>

type TaggedResumeQueryResult = {
  key: string
  result: ResumeQueryResult
}

function useDebouncedValue<T>(value: T, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedValue(value), delay)
    return () => window.clearTimeout(timeout)
  }, [delay, value])

  return debouncedValue
}

export function useResumeTable() {
  const [query, setInputQuery] = useState('')
  const [page, setPageState] = useState(DEFAULT_PAGE)
  const [perPage, setPerPageState] = useState(DEFAULT_PAGE_SIZE)

  const debouncedQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS)

  const totalDbCount = useLiveQuery(() => db.resumes.count(), [])

  const queryKey = `${debouncedQuery}\u0000${page}\u0000${perPage}`
  const taggedResult = useLiveQuery<TaggedResumeQueryResult>(
    async () => ({
      key: queryKey,
      result: await queryResumes({
        query: debouncedQuery,
        page,
        perPage,
      }),
    }),
    [queryKey],
  )

  const result =
    taggedResult?.key === queryKey ? taggedResult.result : undefined

  const pagination = result?.pagination ?? getPageMetadata(0, { page, perPage })

  const isLoading = result === undefined
  const isSearching = query !== debouncedQuery
  const isInitialLoading = isLoading || totalDbCount === undefined

  const setQuery = useCallback((value: string) => {
    setInputQuery(value)
    setPageState(DEFAULT_PAGE)
  }, [])

  const setPage = useCallback((value: number) => {
    setPageState(toPositiveInteger(value, DEFAULT_PAGE))
  }, [])

  const setPerPage = useCallback((value: number) => {
    setPerPageState(toPositiveInteger(value, DEFAULT_PAGE_SIZE))
    setPageState(DEFAULT_PAGE)
  }, [])

  return {
    query,
    debouncedQuery,
    resultQuery: debouncedQuery,
    isSearchPending: isSearching,
    isInitialLoading,
    totalDbCount,
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
