import { useNavigate } from 'react-router-dom'
import { File01Icon, FileAddIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Button,
  Heading1,
  Heading3,
  SearchInput,
  Subheading,
} from '../../../components/ui'
import type { Resume } from '../../../db/db'
import { createResume } from '../../../db/resume'
import { usePageTitle } from '../../../hooks/usePageTitle'
import { useResumeTable } from '../../../hooks/useResumeTable'
import { ResumesTable } from './components/ResumesTable'

export default function ResumesListPage() {
  const table = useResumeTable()
  const navigate = useNavigate()

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

function LoadingState() {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-12">
      <div className="mx-auto h-4 w-40 animate-pulse rounded bg-gray-200" />
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
      <HugeiconsIcon
        icon={File01Icon}
        size={28}
        strokeWidth={2}
        className="text-gray-400"
      />
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
      <HugeiconsIcon
        icon={File01Icon}
        size={28}
        strokeWidth={2}
        className="text-gray-400"
      />
      <Heading3>No resumes yet</Heading3>
      <Subheading>Create your first resume to get started.</Subheading>
      <Button icon={FileAddIcon} onClick={onCreateResume}>
        Create your first resume
      </Button>
    </div>
  )
}
