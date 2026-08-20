import { Link, useNavigate } from 'react-router-dom'
import { Tooltip } from '@base-ui/react/tooltip'
import {
  Copy01Icon,
  Edit02Icon,
  EyeIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon, type HugeiconsIconProps } from '@hugeicons/react'
import type { Resume } from '../../../../db/db'
import { Pagination } from './Pagination'

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
  onDuplicate: (resume: Resume) => void
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
    onDuplicate,
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
                onDuplicate={onDuplicate}
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
  onDuplicate: (resume: Resume) => void
}

function ResumesTableRow(props: Readonly<ResumesTableRowProps>) {
  const { resume, onDuplicate } = props
  const navigate = useNavigate()

  const viewUrl = `/resumes/${resume.id}`
  const editUrl = `/resumes/${resume.id}/edit`

  return (
    <tr className="border-b border-gray-100 transition-colors hover:bg-gray-50">
      <td className="w-full px-4 py-3">
        <Link
          to={viewUrl}
          className="text-sm font-medium text-gray-900 hover:text-gray-600 focus:outline-none focus-visible:ring-1 focus-visible:ring-gray-400"
        >
          {resume.title}
        </Link>
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
            onClick={() => navigate(viewUrl)}
          />
          <QuickAction
            label="Edit"
            icon={Edit02Icon}
            onClick={() => navigate(editUrl)}
          />
          <QuickAction
            label="Duplicate"
            icon={Copy01Icon}
            onClick={() => onDuplicate(resume)}
          />
        </div>
      </td>
    </tr>
  )
}

type QuickActionProps = {
  label: string
  icon: HugeiconsIconProps['icon']
  onClick: () => void
}

function QuickAction(props: Readonly<QuickActionProps>) {
  const { label, icon, onClick } = props

  return (
    <Tooltip.Root>
      <Tooltip.Trigger
        aria-label={label}
        onClick={onClick}
        className="flex size-8 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus-visible:ring-1 focus-visible:ring-gray-400"
      >
        <HugeiconsIcon icon={icon} size={16} strokeWidth={2} />
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Positioner sideOffset={6}>
          <Tooltip.Popup className="rounded-md bg-gray-900 px-2 py-1 text-xs font-medium text-white shadow-sm">
            {label}
          </Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
  )
}
