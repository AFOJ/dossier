export const DEFAULT_PAGE_SIZE = 10
export const PAGE_SIZE_OPTIONS = [2, 5, 10, 25, 50, 100] as const

export type Pagination = {
  page: number
  perPage: number
}

export type PaginationInput = Partial<Pagination>

export type PageMetadata = Pagination & {
  totalCount: number
  totalPages: number
}

export function toPositiveInteger(value: number, fallback: number) {
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : fallback
}

export function getPageMetadata(
  totalCount: number,
  pagination: PaginationInput,
): PageMetadata {
  const perPage = toPositiveInteger(
    pagination.perPage ?? DEFAULT_PAGE_SIZE,
    DEFAULT_PAGE_SIZE,
  )
  const totalPages = Math.max(1, Math.ceil(totalCount / perPage))

  return {
    totalCount,
    perPage,
    totalPages,
    page: Math.min(toPositiveInteger(pagination.page ?? 1, 1), totalPages),
  }
}

export function getPageRange(metadata: PageMetadata) {
  if (metadata.totalCount === 0) {
    return { start: 0, end: 0 }
  }

  return {
    start: (metadata.page - 1) * metadata.perPage + 1,
    end: Math.min(metadata.page * metadata.perPage, metadata.totalCount),
  }
}

export function getVisiblePageNumbers(
  current: number,
  total: number,
): (number | 'ellipsis')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1)
  }

  const pages = [...new Set([1, total, current - 1, current, current + 1])]
    .filter((page) => page >= 1 && page <= total)
    .sort((a, b) => a - b)

  return pages.flatMap((page, index) => {
    const previous = pages[index - 1] ?? 0
    return page - previous > 1 ? ['ellipsis', page] : [page]
  })
}
