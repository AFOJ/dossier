import { useEffect, useRef, type ReactNode } from "react"
import { Pagination } from "@/components/table/Pagination"

const checkboxClassName =
  "size-4 rounded-md border-gray-300 text-black focus:ring-primary-500 accent-black"

export type EntityTableColumn<Item> = {
  key: string
  header: string
  headerClassName?: string
  cellClassName?: string
  renderCell: (item: Item) => ReactNode
}

type EntityTableProps<Item> = {
  items: Item[]
  columns: EntityTableColumn<Item>[]
  renderActions: (item: Item) => ReactNode
  getItemId: (item: Item) => string
  getSelectLabel: (item: Item) => string
  selectAllLabel: string
  page: number
  perPage: number
  totalPages: number
  totalCount: number
  onPageChange: (page: number) => void
  onPerPageChange: (perPage: number) => void
  selectedIds: Set<string>
  isAllSelected: boolean
  isIndeterminate: boolean
  onToggleSelect: (id: string) => void
  onSelectAll: (ids: string[]) => void
  onClearSelection: () => void
  onRowClick?: (item: Item) => void
}

export function EntityTable<Item>(props: Readonly<EntityTableProps<Item>>) {
  const {
    items,
    columns,
    renderActions,
    getItemId,
    getSelectLabel,
    selectAllLabel,
    page,
    perPage,
    totalPages,
    totalCount,
    onPageChange,
    onPerPageChange,
    selectedIds,
    isAllSelected,
    isIndeterminate,
    onToggleSelect,
    onSelectAll,
    onClearSelection,
    onRowClick,
  } = props

  const selectAllCheckboxRef = useRef<HTMLInputElement>(null)

  const handleSelectAll = () => {
    if (isAllSelected) {
      onClearSelection()
      return
    }
    onSelectAll(
      items.map((item) => {
        return getItemId(item)
      }),
    )
  }

  useEffect(() => {
    if (selectAllCheckboxRef.current) {
      selectAllCheckboxRef.current.indeterminate = isIndeterminate
    }
  }, [isIndeterminate])

  const handleRowClick = (rowEvent: React.MouseEvent<HTMLTableRowElement>, item: Item) => {
    if (rowEvent.target instanceof Element && rowEvent.target.closest("a,button,input")) {
      return
    }
    onRowClick?.(item)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-200 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
              <th className="px-4 py-3 w-12">
                <input
                  ref={selectAllCheckboxRef}
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={() => {
                    handleSelectAll()
                  }}
                  aria-label={selectAllLabel}
                  className={checkboxClassName}
                />
              </th>
              {columns.map((column) => {
                return (
                  <th key={column.key} className={column.headerClassName ?? "px-4 py-3"}>
                    {column.header}
                  </th>
                )
              })}
              <th className="px-4 py-3 text-right">Quick actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const itemId = getItemId(item)
              const isSelected = selectedIds.has(itemId)
              return (
                <tr
                  key={itemId}
                  className={`border-b border-gray-100 transition-colors ${isSelected ? "bg-primary-50" : "hover:bg-gray-50"}`}
                  onClick={
                    onRowClick
                      ? (rowEvent) => {
                          handleRowClick(rowEvent, item)
                        }
                      : undefined
                  }
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {
                        onToggleSelect(itemId)
                      }}
                      onClick={(clickEvent) => {
                        clickEvent.stopPropagation()
                      }}
                      aria-label={getSelectLabel(item)}
                      className={checkboxClassName}
                    />
                  </td>
                  {columns.map((column) => {
                    return (
                      <td key={column.key} className={column.cellClassName ?? "px-4 py-3"}>
                        {column.renderCell(item)}
                      </td>
                    )
                  })}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">{renderActions(item)}</div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <Pagination
        page={page}
        perPage={perPage}
        totalPages={totalPages}
        totalCount={totalCount}
        onPageChange={onPageChange}
        onPerPageChange={onPerPageChange}
      />
    </div>
  )
}
