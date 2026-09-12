import { FileAddIcon } from "@hugeicons/core-free-icons"
import { IsometricCircleX, IsometricLibraryAdd } from "@/components/illustrations"
import { ButtonLink, Heading3, Subheading } from "@/components/ui"
import type { CoverLetter } from "@/db/db"
import { type useCoverLetterTable } from "@/hooks/useCoverLetterTable"
import { CoverLettersTable } from "@/pages/cover-letters/list/components/CoverLettersTable"
import { TableSkeleton } from "@/components/table"

type CoverLetterTableState = ReturnType<typeof useCoverLetterTable>

type CoverLetterListContentProps = {
  table: CoverLetterTableState
  onExport: (letter: CoverLetter) => void
  onDuplicate: (letter: CoverLetter) => void
  onDelete: (letter: CoverLetter) => void
}

export function CoverLetterListContent(props: Readonly<CoverLetterListContentProps>) {
  const { table, onExport, onDuplicate, onDelete } = props

  if (table.isLoading || table.totalDbCount === undefined) {
    return (
      <TableSkeleton
        headers={["Cover letter title", "Created", "Last updated"]}
        actionButtonCount={4}
        ariaLabel="Loading cover letters"
      />
    )
  }

  const dbCount = table.totalDbCount
  const isSettled = !table.isSearchPending && !table.isRefreshing
  const effectiveQuery = isSettled ? table.query : table.resultQuery

  if (dbCount === 0) {
    return <EmptyState />
  }

  if (table.totalCount === 0 && effectiveQuery.trim() !== "") {
    return <NoResults query={effectiveQuery} />
  }

  const isAllSelected = table.isAllSelected
  const isIndeterminate = table.selectedCount > 0 && !isAllSelected

  return (
    <div aria-busy={!isSettled}>
      <CoverLettersTable
        letters={table.pageItems ?? []}
        page={table.page}
        perPage={table.perPage}
        totalPages={table.totalPages}
        totalCount={table.totalCount}
        onPageChange={table.setPage}
        onPerPageChange={table.setPerPage}
        onExport={onExport}
        onDuplicate={onDuplicate}
        onDelete={onDelete}
        selectedIds={table.selectedIds}
        isAllSelected={isAllSelected}
        isIndeterminate={isIndeterminate}
        onToggleSelect={table.toggleSelect}
        onSelectAll={table.selectAll}
        onClearSelection={table.clearSelection}
      />
    </div>
  )
}

function NoResults({ query }: Readonly<{ query: string }>) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center">
      <IsometricCircleX />
      <Heading3>No matches</Heading3>
      <Subheading>
        No cover letters match "<span className="break-all">{query}</span>".
      </Subheading>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center">
      <IsometricLibraryAdd />
      <Heading3>No cover letters yet</Heading3>
      <Subheading>Create your first cover letter to get started.</Subheading>
      <ButtonLink icon={FileAddIcon} to="/cover-letters/create">
        Create your first cover letter
      </ButtonLink>
    </div>
  )
}
