import { useState } from "react"
import { Button, Heading3 } from "@/components/ui"
import type { ModalContentProps } from "@/components/modal"
import { useToast } from "@/components/toast"
import type { CoverLetter } from "@/db/db"
import { deleteCoverLetter } from "@/db/coverLetter"

export function DeleteCoverLetterDialog({
  data: letter,
  close,
}: Readonly<ModalContentProps<CoverLetter>>) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const toast = useToast()

  const handleDelete = async () => {
    setIsDeleting(true)
    setError(null)

    if (!letter.id) {
      toast.error("Failed to delete cover letter", "This cover letter could not be found.")
      close()
      return
    }

    try {
      await deleteCoverLetter(letter.id)
      toast.success("Cover letter deleted", `"${letter.title}" was deleted.`)
      close()
    } catch {
      setError("Failed to delete cover letter. Please try again.")
      toast.error("Failed to delete cover letter", "Please try again.")
      setIsDeleting(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <Heading3>Delete cover letter?</Heading3>
        <p className="text-sm leading-6 text-gray-600">
          This will permanently delete{" "}
          <span className="font-medium text-gray-900">{letter.title}</span> and cannot be undone.
        </p>
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
          {isDeleting ? "Deleting..." : "Delete cover letter"}
        </Button>
      </div>
    </div>
  )
}
