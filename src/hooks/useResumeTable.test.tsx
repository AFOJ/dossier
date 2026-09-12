import "fake-indexeddb/auto"
import type { ReactNode } from "react"
import { renderHook, act, waitFor } from "@testing-library/react"
import { MemoryRouter, useLocation, useNavigate } from "react-router-dom"
import { beforeEach, describe, it, expect } from "vitest"
import { useResumeTable } from "@/hooks/useResumeTable"
import { db } from "@/db/db"
import { createResume } from "@/db/resume"

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

function routerWrapper(initialEntries: string[], initialIndex?: number) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <MemoryRouter initialEntries={initialEntries} initialIndex={initialIndex}>
        {children}
      </MemoryRouter>
    )
  }
}

function renderTable(initialEntries: string[] = ["/"]) {
  return renderHook(() => useResumeTable(), {
    wrapper: routerWrapper(initialEntries),
  })
}

function renderTableWithLocation(initialEntries: string[], initialIndex?: number) {
  return renderHook(
    () => ({
      table: useResumeTable(),
      location: useLocation(),
      navigate: useNavigate(),
    }),
    { wrapper: routerWrapper(initialEntries, initialIndex) },
  )
}

function searchParamsOf(search: string) {
  return new URLSearchParams(search.startsWith("?") ? search.slice(1) : search)
}

describe("useResumeTable", () => {
  it("paginates with only the page slice loaded", async () => {
    await seedResumes(Array.from({ length: 12 }, (_, i) => `Resume ${i}`))

    const { result } = renderTable()

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

  it("filters by query and resets the page", async () => {
    await seedResumes(["Frontend Engineer", "Backend Engineer", "Product Designer"])

    const { result } = renderTableWithLocation(["/"])

    await waitFor(() => expect(result.current.table.isLoading).toBe(false))

    act(() => result.current.table.setQuery("engineer"))
    await waitFor(() => expect(result.current.table.totalCount).toBe(2), {
      timeout: 3000,
    })
    expect(result.current.table.page).toBe(1)
    expect(result.current.table.pageItems?.map((r) => r.title).sort()).toEqual([
      "Backend Engineer",
      "Frontend Engineer",
    ])
  })

  it("returns newest-updated-first", async () => {
    await createResume("Old", [])
    await delay(10)
    await createResume("New", [])

    const { result } = renderTable()

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.pageItems?.map((r) => r.title)).toEqual(["New", "Old"])
  })

  it("clamps an out-of-range page to the last page", async () => {
    await seedResumes(Array.from({ length: 5 }, (_, i) => `Resume ${i}`))

    const { result } = renderTableWithLocation(["/"])

    await waitFor(() => expect(result.current.table.isLoading).toBe(false))
    act(() => result.current.table.setPerPage(2))
    act(() => result.current.table.setPage(99))
    await waitFor(() => expect(result.current.table.page).toBe(3))
    expect(result.current.table.totalPages).toBe(3)
    expect(result.current.table.pageItems).toHaveLength(1)
  })

  it("toggles selection and derives the selected count", async () => {
    await seedResumes(["Resume 0", "Resume 1"])

    const { result } = renderTable()

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.selectedCount).toBe(0)
    expect(result.current.isAllSelected).toBe(false)

    const [first, second] = result.current.pageItems ?? []
    const firstId = first.id!
    const secondId = second.id!

    act(() => result.current.toggleSelect(firstId))
    expect(result.current.selectedIds.has(firstId)).toBe(true)
    expect(result.current.selectedCount).toBe(1)
    expect(result.current.isAllSelected).toBe(false)

    act(() => result.current.toggleSelect(secondId))
    expect(result.current.selectedCount).toBe(2)
    expect(result.current.isAllSelected).toBe(true)

    act(() => result.current.toggleSelect(firstId))
    expect(result.current.selectedIds.has(firstId)).toBe(false)
    expect(result.current.selectedCount).toBe(1)
    expect(result.current.isAllSelected).toBe(false)
  })

  it("selects all page items and clears the selection", async () => {
    await seedResumes(["Resume 0", "Resume 1"])

    const { result } = renderTable()

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    const ids = (result.current.pageItems ?? []).map((r) => r.id!)

    act(() => result.current.selectAll(ids))
    expect(result.current.selectedCount).toBe(2)
    expect(result.current.isAllSelected).toBe(true)

    act(() => result.current.clearSelection())
    expect(result.current.selectedCount).toBe(0)
    expect(result.current.selectedIds.size).toBe(0)
  })

  it("clears the selection when the page, page size, or query changes", async () => {
    await seedResumes(["Resume 0", "Resume 1", "Resume 2"])

    const { result } = renderTable()

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    const ids = (result.current.pageItems ?? []).map((r) => r.id!)

    act(() => result.current.selectAll(ids))
    expect(result.current.selectedCount).toBe(3)

    act(() => result.current.setPerPage(2))
    await waitFor(() => expect(result.current.selectedCount).toBe(0))

    act(() => result.current.selectAll(ids.slice(0, 2)))
    expect(result.current.selectedCount).toBe(2)

    act(() => result.current.setPage(2))
    expect(result.current.selectedCount).toBe(0)

    act(() => result.current.selectAll(ids.slice(0, 1)))
    expect(result.current.selectedCount).toBe(1)

    act(() => result.current.setQuery("Resume"))
    expect(result.current.selectedCount).toBe(0)
  })

  it("debounces clearing the query until the unfiltered results are ready", async () => {
    await seedResumes(["Resume 0"])

    const { result } = renderTable()

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    act(() => result.current.setQuery("Resume 0"))
    expect(result.current.query).toBe("Resume 0")
    await waitFor(() => expect(result.current.resultQuery).toBe("Resume 0"), {
      timeout: 3000,
    })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    act(() => result.current.setQuery(""))
    expect(result.current.query).toBe("")
    expect(result.current.resultQuery).toBe("Resume 0")
    expect(result.current.isSearchPending).toBe(true)

    await waitFor(() => expect(result.current.resultQuery).toBe(""), {
      timeout: 3000,
    })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.pageItems?.map((resume) => resume.title)).toEqual(["Resume 0"])
  })

  it("initialises the list from URL parameters", async () => {
    await seedResumes(["Frontend Engineer", "Backend Engineer", "Product Designer"])

    const { result } = renderTable(["/?query=engineer"])

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.query).toBe("engineer")
    expect(result.current.totalCount).toBe(2)
    expect(result.current.pageItems?.map((r) => r.title).sort()).toEqual([
      "Backend Engineer",
      "Frontend Engineer",
    ])
  })

  it("initialises pagination from URL parameters", async () => {
    await seedResumes(Array.from({ length: 5 }, (_, i) => `Resume ${i}`))

    const { result } = renderTable(["/?page=2&perPage=2"])

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.page).toBe(2)
    expect(result.current.perPage).toBe(2)
    expect(result.current.pageItems).toHaveLength(2)
  })

  it("commits search to the URL and omits the param when cleared", async () => {
    await seedResumes(["Frontend Engineer", "Product Designer"])

    const { result } = renderTableWithLocation(["/"])

    await waitFor(() => expect(result.current.table.isLoading).toBe(false))

    act(() => result.current.table.setQuery("engineer"))
    await waitFor(
      () =>
        expect(searchParamsOf(result.current.location.search).get("query")).toBe(
          "engineer",
        ),
      { timeout: 3000 },
    )

    act(() => result.current.table.setQuery(""))
    await waitFor(
      () =>
        expect(searchParamsOf(result.current.location.search).has("query")).toBe(false),
      { timeout: 3000 },
    )
    await waitFor(() => expect(result.current.table.isLoading).toBe(false))
    expect(result.current.table.totalCount).toBe(2)
  })

  it("resets to the first page when search commits", async () => {
    await seedResumes(Array.from({ length: 12 }, (_, i) => `Resume ${i}`))

    const { result } = renderTableWithLocation(["/?page=2"])

    await waitFor(() => expect(result.current.table.isLoading).toBe(false))
    expect(result.current.table.page).toBe(2)

    act(() => result.current.table.setQuery("Resume 1"))
    await waitFor(
      () =>
        expect(searchParamsOf(result.current.location.search).get("query")).toBe(
          "Resume 1",
        ),
      { timeout: 3000 },
    )
    expect(searchParamsOf(result.current.location.search).has("page")).toBe(false)
    await waitFor(() => expect(result.current.table.page).toBe(1))
  })

  it("pushes page changes and omits the default page", async () => {
    await seedResumes(Array.from({ length: 12 }, (_, i) => `Resume ${i}`))

    const { result } = renderTableWithLocation(["/"])

    await waitFor(() => expect(result.current.table.isLoading).toBe(false))

    act(() => result.current.table.setPage(2))
    await waitFor(() => expect(result.current.table.page).toBe(2))
    expect(searchParamsOf(result.current.location.search).get("page")).toBe("2")

    act(() => result.current.table.setPage(1))
    await waitFor(
      () =>
        expect(searchParamsOf(result.current.location.search).has("page")).toBe(false),
    )
    await waitFor(() => expect(result.current.table.page).toBe(1))
  })

  it("supports back navigation through pushed pages", async () => {
    await seedResumes(Array.from({ length: 12 }, (_, i) => `Resume ${i}`))

    const { result } = renderTableWithLocation(["/"])

    await waitFor(() => expect(result.current.table.isLoading).toBe(false))

    act(() => result.current.table.setPage(2))
    await waitFor(() => expect(result.current.table.page).toBe(2))

    act(() => result.current.navigate(-1))
    await waitFor(() => expect(result.current.table.page).toBe(1))
    expect(searchParamsOf(result.current.location.search).has("page")).toBe(false)
  })

  it("omits the default page size and resets the page on change", async () => {
    await seedResumes(Array.from({ length: 12 }, (_, i) => `Resume ${i}`))

    const { result } = renderTableWithLocation(["/?page=2&perPage=2"])

    await waitFor(() => expect(result.current.table.isLoading).toBe(false))
    expect(result.current.table.perPage).toBe(2)

    act(() => result.current.table.setPerPage(10))
    await waitFor(
      () =>
        expect(searchParamsOf(result.current.location.search).has("perPage")).toBe(
          false,
        ),
    )
    expect(searchParamsOf(result.current.location.search).has("page")).toBe(false)
    await waitFor(() => expect(result.current.table.perPage).toBe(10))
    await waitFor(() => expect(result.current.table.page).toBe(1))
  })

  it("preserves unrelated URL parameters", async () => {
    await seedResumes(["Resume 0"])

    const { result } = renderTableWithLocation(["/?tab=archived"])

    await waitFor(() => expect(result.current.table.isLoading).toBe(false))

    act(() => result.current.table.setPage(2))
    await waitFor(() =>
      expect(searchParamsOf(result.current.location.search).get("tab")).toBe(
        "archived",
      ),
    )
    expect(searchParamsOf(result.current.location.search).get("page")).toBe("2")
  })

  it("normalises invalid pagination values to defaults", async () => {
    await seedResumes(["Resume 0"])

    const { result } = renderTable(["/?page=abc&perPage=-5"])

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.page).toBe(1)
    expect(result.current.perPage).toBe(10)
    expect(result.current.totalCount).toBe(1)
  })

  it("syncs the search input on back navigation", async () => {
    await seedResumes(["Frontend Engineer", "Product Designer"])

    const { result } = renderTableWithLocation(
      ["/", "/?query=engineer"],
      1,
    )

    await waitFor(() => expect(result.current.table.isLoading).toBe(false))
    expect(result.current.table.query).toBe("engineer")
    expect(result.current.table.totalCount).toBe(1)

    act(() => result.current.navigate(-1))
    await waitFor(() => expect(result.current.table.query).toBe(""))
    await waitFor(() => expect(result.current.table.totalCount).toBe(2), {
      timeout: 3000,
    })
  })

  it("replaces rather than pushes search commits", async () => {
    await seedResumes(["Frontend Engineer", "Product Designer"])

    // A forward entry survives only if the search commit replaces.
    const { result } = renderTableWithLocation(
      ["/", "/?query=designer"],
      0,
    )

    await waitFor(() => expect(result.current.table.isLoading).toBe(false))

    act(() => result.current.table.setQuery("engineer"))
    await waitFor(
      () =>
        expect(searchParamsOf(result.current.location.search).get("query")).toBe(
          "engineer",
        ),
      { timeout: 3000 },
    )

    act(() => result.current.navigate(1))
    await waitFor(
      () =>
        expect(searchParamsOf(result.current.location.search).get("query")).toBe(
          "designer",
        ),
    )
    expect(result.current.table.query).toBe("designer")
  })
})
