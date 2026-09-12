import { useState } from "react"
import { Button, Heading3 } from "@/components/ui"
import type { ModalContentProps } from "@/components/modal"
import { useToast } from "@/components/toast"
import type { CoverLetter } from "@/db/db"
import { deleteCoverLetter } from "@/db/coverLetter"

interface BulkDeleteDialogData {
  letters: CoverLetter[]
  onComplete: () => void
}

const MAX_DISPLAY = 10

export function BulkDeleteDialog(props: Readonly<ModalContentProps<BulkDeleteDialogData>>) {
  const {
    data: { letters, onComplete },
    close,
  } = props
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [remaining, setRemaining] = useState<CoverLetter[]>(letters)
  const [deletedCount, setDeletedCount] = useState(0)
  const toast = useToast()

  const handleDelete = async () => {
    setIsDeleting(true)
    setError(null)

    const failed: CoverLetter[] = []
    let deleted = 0
    for (const letter of remaining) {
      if (!letter.id) {
        continue
      }
      try {
        await deleteCoverLetter(letter.id)
        deleted += 1
      } catch {
        failed.push(letter)
      }
    }

    const totalDeleted = deletedCount + deleted
    if (failed.length === 0) {
      toast.success(
        "Cover letters deleted",
        `${totalDeleted} cover letter${totalDeleted === 1 ? "" : "s"} deleted.`,
      )
      onComplete()
      close()
      return
    }

    setRemaining(failed)
    setDeletedCount(totalDeleted)
    setError(
      `Deleted ${totalDeleted} of ${letters.length} cover letters. ${failed.length} could not be deleted. You can retry the remaining ones.`,
    )
    toast.error("Some cover letters could not be deleted", `${failed.length} remaining.`)
    setIsDeleting(false)
  }

  const displayLetters = remaining.slice(0, MAX_DISPLAY)
  const hiddenCount = remaining.length - MAX_DISPLAY

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <Heading3>
          Delete {remaining.length} cover letter{remaining.length === 1 ? "" : "s"}?
        </Heading3>
        <p className="text-sm leading-6 text-gray-600">
          This will permanently delete the following and cannot be undone.
        </p>
      </div>

      <div className="max-h-60 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm">
        <ul className="flex flex-col gap-1">
          {displayLetters.map((letter) => {
            return (
              <li key={letter.id} className="truncate font-medium text-gray-900">
                {letter.title}
              </li>
            )
          })}
          {hiddenCount > 0 && <li className="text-gray-500">+ {hiddenCount} more...</li>}
        </ul>
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="flex flex-wrap justify-end gap-2">
        <Button intent="secondary" onClick={close} disabled={isDeleting} autoFocus>
          Cancel
        </Button>
        <Button
          onClick={handleDelete}
          disabled={isDeleting}
          className="bg-red-700 enabled:hover:bg-red-800 focus:ring-red-500"
        >
          {isDeleting
            ? "Deleting..."
            : `Delete ${remaining.length} cover letter${remaining.length === 1 ? "" : "s"}`}
        </Button>
      </div>
    </div>
  )
}
