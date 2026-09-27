import "fake-indexeddb/auto"
import type { ReactNode } from "react"
import { act, renderHook, waitFor } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { beforeEach, describe, expect, it } from "vitest"
import { db } from "@/db/db"
import { createTag } from "@/db/tag"
import { useTagsTable } from "@/hooks/useTagsTable"

const delay = (ms = 5) => new Promise((resolve) => setTimeout(resolve, ms))

beforeEach(async () => {
  await db.tags.clear()
})

async function seedTags(names: string[]) {
  for (const name of names) {
    await createTag({ name, colour: "#abc" })
    await delay()
  }
}

function wrapper(initialEntries: string[]) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
  }
}

describe("useTagsTable", () => {
  it("paginates, searches, and clamps out-of-range pages", async () => {
    await seedTags(Array.from({ length: 12 }, (_, index) => `Tag ${index}`))

    const { result } = renderHook(() => useTagsTable(), { wrapper: wrapper(["/tags"]) })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.pageItems).toHaveLength(10)
    expect(result.current.totalCount).toBe(12)
    expect(result.current.totalPages).toBe(2)

    act(() => result.current.setPerPage(2))
    await waitFor(() => expect(result.current.totalPages).toBe(6))
    act(() => result.current.setPage(99))
    await waitFor(() => expect(result.current.page).toBe(6))
    expect(result.current.pageItems).toHaveLength(2)

    act(() => result.current.setQuery("Tag 10"))
    await waitFor(() => expect(result.current.totalCount).toBe(1), { timeout: 3000 })
    expect(result.current.page).toBe(1)
    expect(result.current.pageItems.map((tag) => tag.name)).toEqual(["Tag 10"])
  })

  it("tracks selection for the current page", async () => {
    await seedTags(["Alpha", "Beta"])

    const { result } = renderHook(() => useTagsTable(), { wrapper: wrapper(["/tags"]) })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const [first, second] = result.current.pageItems
    const firstId = String(first.id)
    const secondId = String(second.id)

    act(() => result.current.toggleSelect(firstId))
    expect(result.current.selectedCount).toBe(1)
    expect(result.current.isAllSelected).toBe(false)

    act(() => result.current.toggleSelect(secondId))
    expect(result.current.selectedCount).toBe(2)
    expect(result.current.isAllSelected).toBe(true)

    act(() => result.current.selectAll([]))
    expect(result.current.selectedCount).toBe(0)
  })
})
