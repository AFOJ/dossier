import { Select } from '@base-ui/react/select'
import {
  CheckmarkCircle01Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Button } from '../../../../components/ui'
import {
  getPageRange,
  getVisiblePageNumbers,
  PAGE_SIZE_OPTIONS,
  type PageMetadata,
} from '../../../../lib/pagination'

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
        <PerPageSelect perPage={perPage} onPerPageChange={onPerPageChange} />
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

type PerPageSelectProps = {
  perPage: number
  onPerPageChange: (perPage: number) => void
}

function PerPageSelect(props: Readonly<PerPageSelectProps>) {
  const { perPage, onPerPageChange } = props

  return (
    <Select.Root value={perPage} onValueChange={(value) => onPerPageChange(value as number)}>
      <Select.Trigger aria-label="Rows per page" className="flex items-center gap-1 rounded-lg border border-gray-400/40 bg-white px-2 py-2 text-sm font-medium text-gray-900 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-gray-600">
        <Select.Value>{perPage}</Select.Value>
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner sideOffset={6}>
          <Select.Popup className="z-50 min-w-(--anchor-width) rounded-lg border border-gray-200 bg-white p-1 shadow-lg">
            {PAGE_SIZE_OPTIONS.map((size) => (
              <Select.Item key={size} value={size} className="flex cursor-pointer items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm text-gray-900 transition-colors data-highlighted:bg-gray-100 focus:outline-none">
                <Select.ItemText>{size}</Select.ItemText>
                <Select.ItemIndicator className="text-gray-900"><HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} strokeWidth={2} /></Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  )
}
