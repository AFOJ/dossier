import {
  Copy01Icon,
  Delete02Icon,
  Edit02Icon,
  EyeIcon,
  FileExportIcon,
} from '@hugeicons/core-free-icons'
import { Button, ButtonLink, Tooltip, type IconProps } from '@/components/ui'
import type { Resume } from '@/db/db'
import { Pagination } from '@/pages/resumes/list/components/Pagination'

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
})

function formatDate(date: Date) {
  return dateFormatter.format(date)
}

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
}

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
  } = props

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-200 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
              <th className="px-4 py-3">Resume title</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3">Last updated</th>
              <th className="px-4 py-3 text-right">Quick actions</th>
            </tr>
          </thead>
          <tbody>
            {resumes.map((resume) => (
              <ResumesTableRow
                key={resume.id}
                resume={resume}
                onPreview={onPreview}
                onExport={onExport}
                onDuplicate={onDuplicate}
                onDelete={onDelete}
              />
            ))}
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
type ResumesTableRowProps = {
  resume: Resume
  onPreview: (resume: Resume) => void
  onExport: (resume: Resume) => void
  onDuplicate: (resume: Resume) => void
  onDelete: (resume: Resume) => void
}

function ResumesTableRow(props: Readonly<ResumesTableRowProps>) {
  const { resume, onPreview, onExport, onDuplicate, onDelete } = props

  const editUrl = `/resumes/${resume.id}/edit`

  return (
    <tr className="border-b border-gray-100 transition-colors hover:bg-gray-50">
      <td className="w-full px-4 py-3 text-left">
        <button
          type="button"
          aria-label={`View ${resume.title}`}
          onClick={() => onPreview(resume)}
          className="block w-full cursor-pointer text-left text-sm font-medium text-gray-900 hover:text-gray-600 focus:outline-none focus-visible:ring-1 focus-visible:ring-gray-400"
        >
          {resume.title}
        </button>
      </td>

      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
        {formatDate(resume.createdAt)}
      </td>

      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
        {formatDate(resume.updatedAt)}
      </td>

      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1">
          <QuickAction
            label="View"
            icon={EyeIcon}
            onClick={() => onPreview(resume)}
          />
          <QuickAction
            label="Export JSON"
            icon={FileExportIcon}
            onClick={() => onExport(resume)}
          />
          <QuickAction label="Edit" icon={Edit02Icon} to={editUrl} />
          <QuickAction
            label="Duplicate"
            icon={Copy01Icon}
            onClick={() => onDuplicate(resume)}
          />
          <QuickAction
            label="Delete"
            icon={Delete02Icon}
            onClick={() => onDelete(resume)}
          />
        </div>
      </td>
    </tr>
  )
}

type QuickActionProps = {
  label: string
  icon: IconProps['icon']
} & (
  | { to: string; onClick?: undefined }
  | { to?: undefined; onClick: () => void }
)

function QuickAction(props: Readonly<QuickActionProps>) {
  const { label, icon, to, onClick } = props
  const className = 'size-8 p-0 text-gray-500 hover:text-gray-900'

  return (
    <Tooltip content={label}>
      {to !== undefined ? (
        <ButtonLink
          aria-label={label}
          icon={icon}
          intent="secondary"
          className={className}
          to={to}
        />
      ) : (
        <Button
          aria-label={label}
          icon={icon}
          intent="secondary"
          onClick={onClick}
          className={className}
        />
      )}
    </Tooltip>
  )
}
