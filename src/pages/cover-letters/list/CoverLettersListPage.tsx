import { createCoverLetter } from "@/db/coverLetter"
import { DeleteCoverLetterDialog } from "@/pages/cover-letters/list/components/DeleteCoverLetterDialog"
import { BulkDeleteDialog } from "@/pages/cover-letters/list/components/BulkDeleteDialog"
import { downloadJson, getExportFilename } from "@/lib/download"
import { toCoverLetterExportPayload } from "@/lib/coverLetterExport"
import { Heading1, Subheading } from "@/components/ui"
import { CoverLetterListContent } from "@/pages/cover-letters/list/components/CoverLetterListContent"
import { slugify } from "@/utils"
import { Toolbar } from "@/pages/cover-letters/list/components/Toolbar"
import { useModal } from "@/components/modal"
import { usePageTitle } from "@/hooks/usePageTitle"
import { useCoverLetterTable } from "@/hooks/useCoverLetterTable"
import { useBulkCoverLetterActions } from "@/hooks/useBulkCoverLetterActions"
import { useToast } from "@/components/toast"
import type { CoverLetter } from "@/db/db"

export default function CoverLettersListPage() {
  const table = useCoverLetterTable()
  const { exportSelected, isExporting } = useBulkCoverLetterActions()
  const deleteModal = useModal(DeleteCoverLetterDialog, {
    closeOnBackdropClick: false,
    closeOnEscape: true,
  })
  const bulkDeleteModal = useModal(BulkDeleteDialog, {
    closeOnBackdropClick: false,
    closeOnEscape: true,
  })
  const toast = useToast()

  usePageTitle("Cover Letters")

  const handleExport = async (letter: CoverLetter) => {
    try {
      const filename = getExportFilename("cover-letter", new Date(), slugify(letter.title))
      downloadJson(filename, toCoverLetterExportPayload(letter))
      toast.success("Cover letter exported", `Saved ${filename}.`)
    } catch {
      toast.error("Could not export cover letter", "Please try again.")
    }
  }

  const handleDuplicate = async (letter: CoverLetter) => {
    try {
      await createCoverLetter(
        {
          title: `Copy of ${letter.title}`,
          subject: letter.subject,
          signoff: letter.signoff,
          body: letter.body,
        },
        {
          syncProfile: letter.syncProfile ?? (letter.contact ? false : true),
          contact: letter.contact ?? null,
        },
      )
      toast.success("Cover letter duplicated", `"${letter.title}" was duplicated.`)
    } catch {
      toast.error("Failed to duplicate cover letter", "Please try again.")
    }
  }

  const selectedLetters =
    table.pageItems?.filter((letter) => {
      return table.selectedIds.has(letter.id!)
    }) ?? []

  const handleBulkExport = () => {
    exportSelected(selectedLetters)
  }

  const handleBulkDelete = () => {
    bulkDeleteModal.open({
      letters: selectedLetters,
      onComplete: () => table.clearSelection(),
    })
  }

  return (
    <section className="flex flex-col gap-6">
      <header>
        <div className="flex flex-col gap-1">
          <Heading1>Cover Letters</Heading1>
          <Subheading>All your cover letters in one place.</Subheading>
        </div>
      </header>

      <Toolbar
        query={table.query}
        onQueryChange={table.setQuery}
        isSearchPending={table.isSearchPending}
        selectedCount={table.selectedCount}
        onBulkExport={handleBulkExport}
        onBulkDelete={handleBulkDelete}
        isBulkExporting={isExporting}
      />

      <CoverLetterListContent
        table={table}
        onExport={handleExport}
        onDuplicate={handleDuplicate}
        onDelete={deleteModal.open}
      />
    </section>
  )
}
