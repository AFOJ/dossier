import {
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@hugeicons/core-free-icons'
import { Button, Select } from '@/components/ui'
import {
  getPageRange,
  getVisiblePageNumbers,
  PAGE_SIZE_OPTIONS,
  type PageMetadata,
} from '@/lib/pagination'

type PaginationProps = PageMetadata & {
  onPageChange: (page: number) => void
  onPerPageChange: (perPage: number) => void
}

export function Pagination(props: Readonly<PaginationProps>) {
  const { page, perPage, totalPages, totalCount, onPageChange, onPerPageChange } =
    props
  const range = getPageRange(props)

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">Rows per page</span>
        <Select
          aria-label="Rows per page"
          options={PAGE_SIZE_OPTIONS.map((size) => ({
            label: String(size),
            value: size,
          }))}
          value={perPage}
          onValueChange={onPerPageChange}
        />
      </div>

      <div className="flex items-center gap-1">
        <Button type="button" intent="secondary" icon={ChevronLeftIcon} aria-label="Previous page" disabled={page === 1} onClick={() => onPageChange(page - 1)} />
        {getVisiblePageNumbers(page, totalPages).map((item, index) =>
          item === 'ellipsis' ? (
            <span key={`ellipsis-${index}`} className="px-1 text-sm text-gray-400">...</span>
          ) : (
            <Button key={item} type="button" intent={item === page ? 'primary' : 'secondary'} className="size-9" aria-label={`Page ${item}`} aria-current={item === page ? 'page' : undefined} onClick={() => onPageChange(item)}>
              {item}
            </Button>
          ),
        )}
        <Button type="button" intent="secondary" icon={ChevronRightIcon} aria-label="Next page" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} />
      </div>

      <p className="text-sm text-gray-500">{range.start} - {range.end} of {totalCount}</p>
    </div>
  )
}
