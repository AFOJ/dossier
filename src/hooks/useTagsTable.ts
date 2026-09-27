import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { useLiveQuery } from "dexie-react-hooks"
import type { Tag } from "@/db/db"
import { listTags } from "@/db/tag"
import { DEFAULT_PAGE_SIZE, getPageMetadata, toPositiveInteger } from "@/lib/pagination"

const DEFAULT_PAGE = 1
const SEARCH_DEBOUNCE_MS = 250
const EMPTY_TAGS: Tag[] = []

export function useTagsTable() {
  const [searchParams, setSearchParams] = useSearchParams()

  const committedQuery = (searchParams.get("query") ?? "").trim()
  const requestedPage = toPositiveInteger(Number(searchParams.get("page")), DEFAULT_PAGE)
  const requestedPerPage = toPositiveInteger(Number(searchParams.get("perPage")), DEFAULT_PAGE_SIZE)

  const [query, setInputQuery] = useState(committedQuery)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())
  const commitTimer = useRef<number | undefined>(undefined)

  const [prevCommitted, setPrevCommitted] = useState(committedQuery)
  if (prevCommitted !== committedQuery) {
    setPrevCommitted(committedQuery)
    setInputQuery(committedQuery)
    setSelectedIds(new Set())
  }

  const updateParams = useCallback(
    (updates: Record<string, string | null>, replace = false) => {
      setSearchParams(
        (previous) => {
          const next = new URLSearchParams(previous)
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

  const tags = useLiveQuery(() => listTags(), [])
  const filteredTags = useMemo(() => {
    const source = tags ?? EMPTY_TAGS
    const normalisedQuery = committedQuery.toLowerCase()
    if (normalisedQuery === "") {
      return source
    }
    return source.filter((tag) => {
      return (
        tag.name.toLowerCase().includes(normalisedQuery) ||
        (tag.description ?? "").toLowerCase().includes(normalisedQuery)
      )
    })
  }, [committedQuery, tags])

  const pagination = getPageMetadata(filteredTags.length, {
    page: requestedPage,
    perPage: requestedPerPage,
  })
  const pageItems = filteredTags.slice(
    (pagination.page - 1) * pagination.perPage,
    pagination.page * pagination.perPage,
  )

  useEffect(() => {
    if (tags && requestedPage !== pagination.page) {
      updateParams(
        { page: pagination.page === DEFAULT_PAGE ? null : String(pagination.page) },
        true,
      )
    }
  }, [pagination.page, requestedPage, tags, updateParams])

  const selectedCount = selectedIds.size
  const isAllSelected =
    pageItems.length > 0 &&
    pageItems.every((tag) => tag.id !== undefined && selectedIds.has(String(tag.id)))

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set())
  }, [setSelectedIds])

  const toggleSelect = useCallback(
    (id: string) => {
      setSelectedIds((previous) => {
        const next = new Set(previous)
        if (next.has(id)) {
          next.delete(id)
        } else {
          next.add(id)
        }
        return next
      })
    },
    [setSelectedIds],
  )

  const selectAll = useCallback(
    (ids: string[]) => {
      setSelectedIds(new Set(ids))
    },
    [setSelectedIds],
  )

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
    [clearSelection, setInputQuery, updateParams],
  )

  const setPage = useCallback(
    (value: number) => {
      const normalised = toPositiveInteger(value, DEFAULT_PAGE)
      updateParams({ page: normalised === DEFAULT_PAGE ? null : String(normalised) })
      clearSelection()
    },
    [clearSelection, updateParams],
  )

  const setPerPage = useCallback(
    (value: number) => {
      const normalised = toPositiveInteger(value, DEFAULT_PAGE_SIZE)
      updateParams({
        perPage: normalised === DEFAULT_PAGE_SIZE ? null : String(normalised),
        page: null,
      })
      clearSelection()
    },
    [clearSelection, updateParams],
  )

  return {
    query,
    resultQuery: committedQuery,
    isSearchPending: query.trim() !== committedQuery,
    totalDbCount: tags?.length,
    setQuery,
    page: pagination.page,
    setPage,
    perPage: pagination.perPage,
    setPerPage,
    totalCount: pagination.totalCount,
    totalPages: pagination.totalPages,
    pageItems,
    isLoading: tags === undefined,
    selectedIds,
    selectedCount,
    isAllSelected,
    toggleSelect,
    selectAll,
    clearSelection,
  }
}
