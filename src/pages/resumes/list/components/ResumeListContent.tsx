import { FileAddIcon } from '@hugeicons/core-free-icons'
import {
  IsometricCircleX,
  IsometricLibraryAdd,
} from '@/components/illustrations'
import { ButtonLink, Heading3, Subheading } from '@/components/ui'
import type { Resume } from '@/db/db'
import { type useResumeTable } from '@/hooks/useResumeTable'
import { ResumesTable } from '@/pages/resumes/list/components/ResumesTable'
import { ResumesTableSkeleton } from '@/pages/resumes/list/components/ResumesTableSkeleton'

type ResumeTableState = ReturnType<typeof useResumeTable>

type ResumeListContentProps = {
  table: ResumeTableState
  onPreview: (resume: Resume) => void
  onExport: (resume: Resume) => void
  onDuplicate: (resume: Resume) => void
  onDelete: (resume: Resume) => void
}

export function ResumeListContent(props: Readonly<ResumeListContentProps>) {
  const { table, onPreview, onExport, onDuplicate, onDelete } = props

  if (
    table.isLoading ||
    table.isSearchPending ||
    table.totalDbCount === undefined
  ) {
    return <ResumesTableSkeleton />
  }

  const dbCount = table.totalDbCount

  const trimmedQuery = table.query.trim()

  if (dbCount === 0) {
    return <EmptyState />
  }

  if (table.totalCount === 0 && trimmedQuery !== '') {
    return <NoResults query={table.query} />
  }

  return (
    <ResumesTable
      resumes={table.pageItems ?? []}
      page={table.page}
      perPage={table.perPage}
      totalPages={table.totalPages}
      totalCount={table.totalCount}
      onPageChange={table.setPage}
      onPerPageChange={table.setPerPage}
      onPreview={onPreview}
      onExport={onExport}
      onDuplicate={onDuplicate}
      onDelete={onDelete}
    />
  )
}

function NoResults({ query }: Readonly<{ query: string }>) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center">
      <IsometricCircleX />
      <Heading3>No matches</Heading3>
      <Subheading>
        No resumes match "<span className="break-all">{query}</span>".
      </Subheading>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center">
      <IsometricLibraryAdd />
      <Heading3>No resumes yet</Heading3>
      <Subheading>Create your first resume to get started.</Subheading>
      <ButtonLink icon={FileAddIcon} to="/resumes/create">
        Create your first resume
      </ButtonLink>
    </div>
  )
}
