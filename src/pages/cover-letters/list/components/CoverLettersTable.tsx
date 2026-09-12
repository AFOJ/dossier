import { Copy01Icon, Delete02Icon, Edit02Icon, FileExportIcon } from "@hugeicons/core-free-icons"
import type { CoverLetter } from "@/db/db"
import {
  EntityTable,
  QuickAction,
  formatTableDate,
  type EntityTableColumn,
} from "@/components/table"

type CoverLettersTableProps = {
  letters: CoverLetter[]
  page: number
  perPage: number
  totalPages: number
  totalCount: number
  onPageChange: (page: number) => void
  onPerPageChange: (perPage: number) => void
  onExport: (letter: CoverLetter) => void
  onDuplicate: (letter: CoverLetter) => void
  onDelete: (letter: CoverLetter) => void
  selectedIds: Set<string>
  isAllSelected: boolean
  isIndeterminate: boolean
  onToggleSelect: (id: string) => void
  onSelectAll: (ids: string[]) => void
  onClearSelection: () => void
}

const columns: EntityTableColumn<CoverLetter>[] = [
  {
    key: "title",
    header: "Cover letter title",
    cellClassName: "w-full px-4 py-3 text-left",
    renderCell: (letter) => {
      return (
        <>
          <span className="block text-sm font-medium text-gray-900 hover:text-gray-600">
            {letter.title}
          </span>
          {letter.subject && <span className="block text-xs text-gray-500">{letter.subject}</span>}
        </>
      )
    },
  },
  {
    key: "created",
    header: "Created",
    cellClassName: "whitespace-nowrap px-4 py-3 text-sm text-gray-500",
    renderCell: (letter) => {
      return formatTableDate(letter.createdAt)
    },
  },
  {
    key: "updated",
    header: "Last updated",
    cellClassName: "whitespace-nowrap px-4 py-3 text-sm text-gray-500",
    renderCell: (letter) => {
      return formatTableDate(letter.updatedAt)
    },
  },
]

export function CoverLettersTable(props: Readonly<CoverLettersTableProps>) {
  const {
    letters,
    page,
    perPage,
    totalPages,
    totalCount,
    onPageChange,
    onPerPageChange,
    onExport,
    onDuplicate,
    onDelete,
    selectedIds,
    isAllSelected,
    isIndeterminate,
    onToggleSelect,
    onSelectAll,
    onClearSelection,
  } = props

  return (
    <EntityTable
      items={letters}
      columns={columns}
      getItemId={(letter) => {
        return letter.id!
      }}
      getSelectLabel={(letter) => {
        return `Select ${letter.title}`
      }}
      selectAllLabel="Select all cover letters on this page"
      page={page}
      perPage={perPage}
      totalPages={totalPages}
      totalCount={totalCount}
      onPageChange={onPageChange}
      onPerPageChange={onPerPageChange}
      selectedIds={selectedIds}
      isAllSelected={isAllSelected}
      isIndeterminate={isIndeterminate}
      onToggleSelect={onToggleSelect}
      onSelectAll={onSelectAll}
      onClearSelection={onClearSelection}
      renderActions={(letter) => {
        return (
          <>
            <QuickAction
              label="Export JSON"
              icon={FileExportIcon}
              onClick={(clickEvent) => {
                clickEvent.stopPropagation()
                onExport(letter)
              }}
            />
            <QuickAction label="Edit" icon={Edit02Icon} to={`/cover-letters/${letter.id}/edit`} />
            <QuickAction
              label="Duplicate"
              icon={Copy01Icon}
              onClick={(clickEvent) => {
                clickEvent.stopPropagation()
                onDuplicate(letter)
              }}
            />
            <QuickAction
              label="Delete"
              icon={Delete02Icon}
              onClick={(clickEvent) => {
                clickEvent.stopPropagation()
                onDelete(letter)
              }}
            />
          </>
        )
      }}
    />
  )
}
