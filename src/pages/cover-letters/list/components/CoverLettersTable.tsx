import {
  Copy01Icon,
  Delete02Icon,
  Edit02Icon,
  EyeIcon,
  FileExportIcon,
} from "@hugeicons/core-free-icons"
import type { CoverLetterQueryItem } from "@/db/coverLetter"
import { tagColourToCss, tagTextColour } from "@/db/tag"
import {
  EntityTable,
  QuickAction,
  formatTableDate,
  type EntityTableColumn,
} from "@/components/table"

type CoverLettersTableProps = {
  letters: CoverLetterQueryItem[]
  page: number
  perPage: number
  totalPages: number
  totalCount: number
  onPageChange: (page: number) => void
  onPerPageChange: (perPage: number) => void
  onPreview: (letter: CoverLetterQueryItem) => void
  onExport: (letter: CoverLetterQueryItem) => void
  onDuplicate: (letter: CoverLetterQueryItem) => void
  onDelete: (letter: CoverLetterQueryItem) => void
  selectedIds: Set<string>
  isAllSelected: boolean
  isIndeterminate: boolean
  onToggleSelect: (id: string) => void
  onSelectAll: (ids: string[]) => void
  onClearSelection: () => void
}

const columns: EntityTableColumn<CoverLetterQueryItem>[] = [
  {
    key: "title",
    header: "Cover letter title",
    cellClassName: "w-full px-4 py-3 text-left",
    renderCell: (letter) => {
      return (
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-gray-900 hover:text-gray-600">
              {letter.title}
            </span>
            {letter.tags.length > 0 && (
              <div className="flex min-w-0 flex-wrap gap-1">
                {letter.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="inline-flex max-w-full items-center rounded-full px-2.5 py-1 text-xs font-semibold"
                    style={{
                      backgroundColor: tagColourToCss(tag.colour),
                      color: tagTextColour(tag.colour),
                    }}
                  >
                    <span className="truncate">{tag.name}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
          {letter.subject && <span className="block text-xs text-gray-500">{letter.subject}</span>}
        </div>
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
    onPreview,
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
      onRowClick={onPreview}
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
              label="Preview"
              icon={EyeIcon}
              onClick={(clickEvent) => {
                clickEvent.stopPropagation()
                onPreview(letter)
              }}
            />
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
