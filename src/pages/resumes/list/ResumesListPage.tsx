import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileAddIcon } from '@hugeicons/core-free-icons'
import {
  IsometricCircleX,
  IsometricLibraryAdd,
} from '@/components/illustrations'
import {
  Button,
  Heading1,
  Heading3,
  SearchInput,
  Subheading,
} from '@/components/ui'
import { type ModalContentProps, useModal } from '@/components/modal'
import type { Resume } from '@/db/db'
import { createResume, deleteResume } from '@/db/resume'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useResumeTable } from '@/hooks/useResumeTable'
import { ResumesTable } from '@/pages/resumes/list/components/ResumesTable'

export default function ResumesListPage() {
  const table = useResumeTable()
  const navigate = useNavigate()
  const deleteModal = useModal(DeleteResumeDialog, {
    closeOnBackdropClick: false,
    closeOnEscape: true,
  })

  usePageTitle('Resumes')

  const goToCreate = () => navigate('/resumes/create')

  const handleDuplicate = async (resume: Resume) => {
    await createResume(`Copy of ${resume.title}`, resume.sections)
  }

  return (
    <section className="flex flex-col gap-6">
      <header>
        <div className="flex flex-col gap-1">
          <Heading1>Resumes</Heading1>
          <Subheading>All your resumes in one place.</Subheading>
        </div>
      </header>

      {table.isLoading ? (
        <LoadingState />
      ) : table.totalCount > 0 || table.query !== '' ? (
        <>
          <Toolbar
            query={table.query}
            onQueryChange={table.setQuery}
            onCreateResume={goToCreate}
          />
          {table.totalCount > 0 ? (
            <ResumesTable
              resumes={table.pageItems ?? []}
              page={table.page}
              perPage={table.perPage}
              totalPages={table.totalPages}
              totalCount={table.totalCount}
              onPageChange={table.setPage}
              onPerPageChange={table.setPerPage}
              onDuplicate={handleDuplicate}
              onDelete={deleteModal.open}
            />
          ) : (
            <NoResults query={table.query} />
          )}
        </>
      ) : (
        <EmptyState onCreateResume={goToCreate} />
      )}
    </section>
  )
}

function DeleteResumeDialog({
  data: resume,
  close,
}: Readonly<ModalContentProps<Resume>>) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    setIsDeleting(true)
    setError(null)

    if (!resume.id) {
      setError('Unable to delete this resume. Please try again.')
      setIsDeleting(false)
      return
    }

    try {
      await deleteResume(resume.id)
      close()
    } catch {
      setError('Unable to delete this resume. Please try again.')
      setIsDeleting(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <Heading3>Delete resume?</Heading3>
        <p className="text-sm leading-6 text-gray-600">
          This will permanently delete{' '}
          <span className="font-medium text-gray-900">{resume.title}</span> and
          cannot be undone.
        </p>
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="flex flex-wrap justify-end gap-2">
        <Button
          intent="secondary"
          onClick={close}
          disabled={isDeleting}
          autoFocus
        >
          Cancel
        </Button>
        <Button
          onClick={handleDelete}
          disabled={isDeleting}
          className="bg-red-700 enabled:hover:bg-red-800 focus:ring-red-500"
        >
          {isDeleting ? 'Deleting...' : 'Delete resume'}
        </Button>
      </div>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="flex flex-col gap-3" aria-label="Loading resumes">
      <div className="flex gap-2">
        <div className="h-10 w-56 animate-pulse rounded-lg bg-gray-100" />
        <div className="h-10 w-28 animate-pulse rounded-lg bg-gray-100" />
      </div>
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <div className="grid grid-cols-[1fr_9rem_9rem_7rem] gap-4 border-b border-gray-200 px-4 py-3">
          <div className="h-3 w-24 animate-pulse rounded bg-gray-200" />
          <div className="h-3 w-16 animate-pulse rounded bg-gray-200" />
          <div className="h-3 w-20 animate-pulse rounded bg-gray-200" />
        </div>
        {[0, 1, 2].map((row) => (
          <div
            key={row}
            className="grid grid-cols-[1fr_9rem_9rem_7rem] gap-4 border-b border-gray-100 px-4 py-4 last:border-0"
          >
            <div className="h-4 w-2/5 animate-pulse rounded bg-gray-100" />
            <div className="h-4 animate-pulse rounded bg-gray-100" />
            <div className="h-4 animate-pulse rounded bg-gray-100" />
            <div className="h-4 animate-pulse rounded bg-gray-100" />
          </div>
        ))}
      </div>
    </div>
  )
}

type ToolbarProps = {
  query: string
  onQueryChange: (query: string) => void
  onCreateResume: () => void
}

function Toolbar(props: Readonly<ToolbarProps>) {
  const { query, onQueryChange, onCreateResume } = props

  return (
    <div className="flex flex-wrap items-center gap-2">
      <SearchInput
        value={query}
        onChange={onQueryChange}
        placeholder="Search resumes"
      />
      <Button intent="secondary" icon={FileAddIcon} onClick={onCreateResume}>
        New resume
      </Button>
    </div>
  )
}

type NoResultsProps = {
  query: string
}

function NoResults(props: Readonly<NoResultsProps>) {
  const { query } = props

  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center">
      <IsometricCircleX />

      <Heading3>No matches</Heading3>
      <Subheading>No resumes match "{query}".</Subheading>
    </div>
  )
}

type EmptyStateProps = {
  onCreateResume: () => void
}

function EmptyState(props: Readonly<EmptyStateProps>) {
  const { onCreateResume } = props

  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center">
      <IsometricLibraryAdd />
      <Heading3>No resumes yet</Heading3>
      <Subheading>Create your first resume to get started.</Subheading>
      <Button icon={FileAddIcon} onClick={onCreateResume}>
        Create your first resume
      </Button>
    </div>
  )
}
