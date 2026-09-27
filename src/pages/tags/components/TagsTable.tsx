import { Delete02Icon, Edit02Icon } from "@hugeicons/core-free-icons"
import type { Tag } from "@/db/db"
import { tagColourToCss, tagTextColour } from "@/db/tag"
import {
  EntityTable,
  QuickAction,
  formatTableDate,
  type EntityTableColumn,
} from "@/components/table"

type TagsTableProps = {
  tags: Tag[]
  page: number
  perPage: number
  totalPages: number
  totalCount: number
  onPageChange: (page: number) => void
  onPerPageChange: (perPage: number) => void
  onEdit: (tag: Tag) => void
  onDelete: (tag: Tag) => void
  selectedIds: Set<string>
  isAllSelected: boolean
  isIndeterminate: boolean
  onToggleSelect: (id: string) => void
  onSelectAll: (ids: string[]) => void
  onClearSelection: () => void
}

const columns: EntityTableColumn<Tag>[] = [
  {
    key: "tag",
    header: "Tag",
    cellClassName: "w-full px-4 py-3 text-left",
    renderCell: (tag) => {
      return (
        <div className="flex min-w-0 flex-col gap-1">
          <span
            className="inline-flex w-fit max-w-full items-center rounded-full px-3 py-1 text-xs font-semibold"
            style={{
              backgroundColor: tagColourToCss(tag.colour),
              color: tagTextColour(tag.colour),
            }}
          >
            <span className="truncate">{tag.name}</span>
          </span>
          {tag.description && (
            <span className="truncate text-xs text-gray-500">{tag.description}</span>
          )}
        </div>
      )
    },
  },
  {
    key: "created",
    header: "Created",
    cellClassName: "whitespace-nowrap px-4 py-3 text-sm text-gray-500",
    renderCell: (tag) => formatTableDate(tag.createdAt),
  },
  {
    key: "updated",
    header: "Last updated",
    cellClassName: "whitespace-nowrap px-4 py-3 text-sm text-gray-500",
    renderCell: (tag) => formatTableDate(tag.updatedAt),
  },
]

export function TagsTable(props: Readonly<TagsTableProps>) {
  const {
    tags,
    page,
    perPage,
    totalPages,
    totalCount,
    onPageChange,
    onPerPageChange,
    onEdit,
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
      items={tags}
      columns={columns}
      getItemId={(tag) => String(tag.id ?? "")}
      getSelectLabel={(tag) => `Select ${tag.name}`}
      selectAllLabel="Select all tags on this page"
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
      renderActions={(tag) => (
        <>
          <QuickAction label="Edit" icon={Edit02Icon} onClick={() => onEdit(tag)} />
          <QuickAction label="Delete" icon={Delete02Icon} onClick={() => onDelete(tag)} />
        </>
      )}
    />
  )
}
