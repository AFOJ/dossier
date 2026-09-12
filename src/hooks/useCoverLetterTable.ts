import { useCallback, useEffect, useRef, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { useLiveQuery } from "dexie-react-hooks"
import { db } from "@/db/db"
import { queryCoverLetters } from "@/db/coverLetter"
import { DEFAULT_PAGE_SIZE, getPageMetadata, toPositiveInteger } from "@/lib/pagination"

const DEFAULT_PAGE = 1
const SEARCH_DEBOUNCE_MS = 250

type CoverLetterQueryResult = Awaited<ReturnType<typeof queryCoverLetters>>

type TaggedCoverLetterQueryResult = {
  key: string
  result: CoverLetterQueryResult
}

export function useCoverLetterTable() {
  const [searchParams, setSearchParams] = useSearchParams()

  const committedQuery = (searchParams.get("query") ?? "").trim()
  const requestedPage = toPositiveInteger(Number(searchParams.get("page")), DEFAULT_PAGE)
  const requestedPerPage = toPositiveInteger(Number(searchParams.get("perPage")), DEFAULT_PAGE_SIZE)

  const [query, setInputQuery] = useState(committedQuery)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const commitTimer = useRef<number | undefined>(undefined)

  const [prevCommitted, setPrevCommitted] = useState(committedQuery)
  if (prevCommitted !== committedQuery) {
    setPrevCommitted(committedQuery)
    setInputQuery(committedQuery)
    setSelectedIds(new Set())
  }

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

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
    return () => {
      window.clearTimeout(commitTimer.current)
    }
  }, [committedQuery])

  const totalDbCount = useLiveQuery(() => db.coverLetters.count(), [])

  const queryKey = `${committedQuery}\u0000${requestedPage}\u0000${requestedPerPage}`
  const taggedResult = useLiveQuery<TaggedCoverLetterQueryResult>(async () => {
    return {
      key: queryKey,
      result: await queryCoverLetters({
        query: committedQuery,
        page: requestedPage,
        perPage: requestedPerPage,
      }),
    }
  }, [queryKey])

  const result = taggedResult?.key === queryKey ? taggedResult.result : undefined

  const displayResult = result ?? taggedResult?.result
  const isRefreshing = displayResult !== result

  const pagination =
    displayResult?.pagination ??
    getPageMetadata(0, { page: requestedPage, perPage: requestedPerPage })

  useEffect(() => {
    if (result && requestedPage !== pagination.page) {
      updateParams(
        { page: pagination.page === DEFAULT_PAGE ? null : String(pagination.page) },
        true,
      )
    }
  }, [pagination.page, requestedPage, result, updateParams])

  const isLoading = displayResult === undefined
  const isSearching = query.trim() !== committedQuery
  const isInitialLoading = isLoading || totalDbCount === undefined

  const pageItems = displayResult?.items ?? []

  const selectedCount = selectedIds.size
  const isAllSelected = pageItems.length > 0 && pageItems.every((l) => selectedIds.has(l.id!))

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const selectAll = useCallback((ids: string[]) => {
    setSelectedIds(new Set(ids))
  }, [])

  const setQuery = useCallback(
    (value: string) => {
      setInputQuery(value)
      clearSelection()
      window.clearTimeout(commitTimer.current)
      commitTimer.current = window.setTimeout(() => {
        const trimmed = value.trim()
        updateParams({ query: trimmed === "" ? null : trimmed, page: null }, true)
      }, SEARCH_DEBOUNCE_MS)
    },
    [clearSelection, updateParams],
  )

  const setPage = useCallback(
    (value: number) => {
      const normalized = toPositiveInteger(value, DEFAULT_PAGE)
      updateParams({ page: normalized === DEFAULT_PAGE ? null : String(normalized) })
      clearSelection()
    },
    [clearSelection, updateParams],
  )

  const setPerPage = useCallback(
    (value: number) => {
      const normalized = toPositiveInteger(value, DEFAULT_PAGE_SIZE)
      updateParams({
        perPage: normalized === DEFAULT_PAGE_SIZE ? null : String(normalized),
        page: null,
      })
      clearSelection()
    },
    [clearSelection, updateParams],
  )

  return {
    query,
    resultQuery: committedQuery,
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
    pageItems,
    isLoading,
    isRefreshing,
    selectedIds,
    selectedCount,
    isAllSelected,
    toggleSelect,
    selectAll,
    clearSelection,
  }
}
