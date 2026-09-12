import {
  Copy01Icon,
  Delete02Icon,
  Edit02Icon,
  EyeIcon,
  FileExportIcon,
} from "@hugeicons/core-free-icons"
import type { Resume } from "@/db/db"
import {
  EntityTable,
  QuickAction,
  formatTableDate,
  type EntityTableColumn,
} from "@/components/table"

type ResumesTableProps = {
  resumes: Resume[]
  page: number
  perPage: number
  totalPages: number
  totalCount: number
  onPageChange: (page: number) => void
  onPerPageChange: (perPage: number) => void
  onPreview: (resume: Resume) => void
  onExport: (resume: Resume) => void
  onDuplicate: (resume: Resume) => void
  onDelete: (resume: Resume) => void
  selectedIds: Set<string>
  isAllSelected: boolean
  isIndeterminate: boolean
  onToggleSelect: (id: string) => void
  onSelectAll: (ids: string[]) => void
  onClearSelection: () => void
}

const columns: EntityTableColumn<Resume>[] = [
  {
    key: "title",
    header: "Resume title",
    cellClassName: "w-full px-4 py-3 text-left cursor-pointer",
    renderCell: (resume) => {
      return (
        <span className="block text-sm font-medium text-gray-900 hover:text-gray-600">
          {resume.title}
        </span>
      )
    },
  },
  {
    key: "created",
    header: "Created",
    cellClassName: "whitespace-nowrap px-4 py-3 text-sm text-gray-500",
    renderCell: (resume) => {
      return formatTableDate(resume.createdAt)
    },
  },
  {
    key: "updated",
    header: "Last updated",
    cellClassName: "whitespace-nowrap px-4 py-3 text-sm text-gray-500",
    renderCell: (resume) => {
      return formatTableDate(resume.updatedAt)
    },
  },
]

export function ResumesTable(props: Readonly<ResumesTableProps>) {
  const {
    resumes,
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
      items={resumes}
      columns={columns}
      getItemId={(resume) => {
        return resume.id!
      }}
      getSelectLabel={(resume) => {
        return `Select ${resume.title}`
      }}
      selectAllLabel="Select all resumes on this page"
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
      onRowClick={onPreview}
      renderActions={(resume) => {
        return (
          <>
            <QuickAction
              label="View"
              icon={EyeIcon}
              onClick={(clickEvent) => {
                clickEvent.stopPropagation()
                onPreview(resume)
              }}
            />
            <QuickAction
              label="Export JSON"
              icon={FileExportIcon}
              onClick={(clickEvent) => {
                clickEvent.stopPropagation()
                onExport(resume)
              }}
            />
            <QuickAction label="Edit" icon={Edit02Icon} to={`/resumes/${resume.id}/edit`} />
            <QuickAction
              label="Duplicate"
              icon={Copy01Icon}
              onClick={(clickEvent) => {
                clickEvent.stopPropagation()
                onDuplicate(resume)
              }}
            />
            <QuickAction
              label="Delete"
              icon={Delete02Icon}
              onClick={(clickEvent) => {
                clickEvent.stopPropagation()
                onDelete(resume)
              }}
            />
          </>
        )
      }}
    />
  )
}
