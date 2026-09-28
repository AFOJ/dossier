import { useState } from "react"
import { Button, Heading3 } from "@/components/ui"
import type { ModalContentProps } from "@/components/modal"
import { useToast } from "@/components/toast"
import type { Tag } from "@/db/db"
import { deleteTag } from "@/db/tag"

type BulkDeleteDialogData = {
  tags: Tag[]
  onComplete: () => void
}

const MAX_DISPLAY = 10

export function BulkDeleteDialog(props: Readonly<ModalContentProps<BulkDeleteDialogData>>) {
  const {
    data: { tags, onComplete },
    close,
  } = props
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [remaining, setRemaining] = useState<Tag[]>(tags)
  const [deletedCount, setDeletedCount] = useState(0)
  const toast = useToast()

  const handleDelete = async () => {
    setIsDeleting(true)
    setError(null)

    const failed: Tag[] = []
    let deleted = 0
    for (const tag of remaining) {
      if (tag.id === undefined) {
        continue
      }
      try {
        await deleteTag(tag.id)
        deleted += 1
      } catch {
        failed.push(tag)
      }
    }

    const totalDeleted = deletedCount + deleted
    if (failed.length === 0) {
      toast.success("Tags deleted", `${totalDeleted} tag${totalDeleted === 1 ? "" : "s"} deleted.`)
      onComplete()
      close()
      return
    }

    setRemaining(failed)
    setDeletedCount(totalDeleted)
    setError(
      `Deleted ${totalDeleted} of ${tags.length} tags. ${failed.length} could not be deleted. You can retry the remaining ones.`,
    )
    toast.error("Some tags could not be deleted", `${failed.length} remaining.`)
    setIsDeleting(false)
  }

  const displayTags = remaining.slice(0, MAX_DISPLAY)
  const hiddenCount = remaining.length - MAX_DISPLAY

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <Heading3>
          Delete {remaining.length} tag{remaining.length === 1 ? "" : "s"}?
        </Heading3>
        <p className="text-sm leading-6 text-gray-600">
          This will remove the selected tags from every resume and cover letter. This action cannot
          be undone.
        </p>
      </div>

      <div className="max-h-60 overflow-y-auto rounded-[10px] border border-gray-200 bg-gray-50 p-4 text-sm">
        <ul className="flex flex-col gap-1">
          {displayTags.map((tag) => (
            <li key={tag.id} className="truncate font-medium text-gray-900">
              {tag.name}
            </li>
          ))}
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
            : `Delete ${remaining.length} tag${remaining.length === 1 ? "" : "s"}`}
        </Button>
      </div>
    </div>
  )
}
