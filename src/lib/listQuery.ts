import { DEFAULT_PAGE_SIZE, toPositiveInteger } from "@/lib/pagination"

export function readListQuery(params: URLSearchParams) {
  return {
    query: (params.get("query") ?? "").trim(),
    page: toPositiveInteger(Number(params.get("page")), 1),
    perPage: toPositiveInteger(Number(params.get("perPage")), DEFAULT_PAGE_SIZE),
  }
}

export function listQueryKey(query: ReturnType<typeof readListQuery>) {
  return `${query.query}\u0000${query.page}\u0000${query.perPage}`
}
