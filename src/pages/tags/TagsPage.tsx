import { Heading1, Heading3, Subheading, Button } from "@/components/ui"
import { IsometricCircleX, IsometricLibraryAdd } from "@/components/illustrations"
import { useModal } from "@/components/modal"
import { usePageTitle } from "@/hooks/usePageTitle"
import { useTagsTable } from "@/hooks/useTagsTable"
import { TableSkeleton } from "@/components/table"
import { DeleteTagDialog } from "@/pages/tags/DeleteTagDialog"
import { BulkDeleteDialog } from "@/pages/tags/components/BulkDeleteDialog"
import { TagsTable } from "@/pages/tags/components/TagsTable"
import { Toolbar } from "@/pages/tags/components/Toolbar"
import { TagFormDialog } from "@/pages/tags/TagFormDialog"

export default function TagsPage() {
  const table = useTagsTable()
  const formModal = useModal(TagFormDialog, {
    contentClassName: "max-w-xl",
    closeOnBackdropClick: false,
    closeOnEscape: true,
  })
  const deleteModal = useModal(DeleteTagDialog, {
    closeOnBackdropClick: false,
    closeOnEscape: true,
  })
  const bulkDeleteModal = useModal(BulkDeleteDialog, {
    closeOnBackdropClick: false,
    closeOnEscape: true,
  })

  usePageTitle("Tags")

  const handleBulkDelete = () => {
    const selectedTags = table.pageItems.filter((tag) => {
      return tag.id !== undefined && table.selectedIds.has(String(tag.id))
    })
    bulkDeleteModal.open({
      tags: selectedTags,
      onComplete: table.clearSelection,
    })
  }

  const isSettled = !table.isSearchPending
  const effectiveQuery = isSettled ? table.query : table.resultQuery
  const isIndeterminate = table.selectedCount > 0 && !table.isAllSelected

  return (
    <section className="flex flex-col gap-6">
      <header>
        <div className="flex flex-col gap-1">
          <Heading1>Tags</Heading1>
          <Subheading>
            Add colour-coded labels to organise your resumes and cover letters.
          </Subheading>
        </div>
      </header>

      <Toolbar
        query={table.query}
        onQueryChange={table.setQuery}
        isSearchPending={table.isSearchPending}
        selectedCount={table.selectedCount}
        onCreate={() => formModal.open({})}
        onBulkDelete={handleBulkDelete}
      />

      {table.isLoading || table.totalDbCount === undefined ? (
        <TableSkeleton
          headers={["Tag", "Created", "Last updated"]}
          actionButtonCount={2}
          ariaLabel="Loading tags"
        />
      ) : table.totalDbCount === 0 ? (
        <EmptyState onCreate={() => formModal.open({})} />
      ) : table.totalCount === 0 && effectiveQuery.trim() !== "" ? (
        <NoResults query={effectiveQuery} />
      ) : (
        <div aria-busy={!isSettled}>
          <TagsTable
            tags={table.pageItems}
            page={table.page}
            perPage={table.perPage}
            totalPages={table.totalPages}
            totalCount={table.totalCount}
            onPageChange={table.setPage}
            onPerPageChange={table.setPerPage}
            onEdit={(tag) => formModal.open({ tag })}
            onDelete={(tag) => deleteModal.open(tag)}
            selectedIds={table.selectedIds}
            isAllSelected={table.isAllSelected}
            isIndeterminate={isIndeterminate}
            onToggleSelect={table.toggleSelect}
            onSelectAll={table.selectAll}
            onClearSelection={table.clearSelection}
          />
        </div>
      )}
    </section>
  )
}

function NoResults({ query }: Readonly<{ query: string }>) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-[10px] border border-dashed border-gray-300 bg-white p-12 text-center">
      <IsometricCircleX />
      <Heading3>No matches</Heading3>
      <Subheading>
        No tags match "<span className="break-all">{query}</span>".
      </Subheading>
    </div>
  )
}

function EmptyState({ onCreate }: Readonly<{ onCreate: () => void }>) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-[10px] border border-dashed border-gray-300 bg-white p-12 text-center">
      <IsometricLibraryAdd />
      <Heading3>No tags yet</Heading3>
      <Subheading>Create your first tag to start organising your documents.</Subheading>
      <Button onClick={onCreate}>Create your first tag</Button>
    </div>
  )
}
