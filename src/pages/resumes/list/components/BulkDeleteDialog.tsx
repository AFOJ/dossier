import { useState } from "react"
import { Button, Heading3 } from "@/components/ui"
import type { ModalContentProps } from "@/components/modal"
import { useToast } from "@/components/toast"
import type { Resume } from "@/db/db"
import { deleteResume } from "@/db/resume"

interface BulkDeleteDialogData {
  resumes: Resume[]
  onComplete: () => void
}

const MAX_DISPLAY = 10

export function BulkDeleteDialog(props: Readonly<ModalContentProps<BulkDeleteDialogData>>) {
  const {
    data: { resumes, onComplete },
    close,
  } = props
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const toast = useToast()

  const handleDelete = async () => {
    setIsDeleting(true)
    setError(null)

    try {
      for (const resume of resumes) {
        if (resume.id) {
          await deleteResume(resume.id)
        }
      }
      toast.success(
        "Resumes deleted",
        `${resumes.length} resume${resumes.length > 1 ? "s" : ""} deleted.`,
      )
      onComplete()
      close()
    } catch {
      setError("Failed to delete resumes. Please try again.")
      toast.error("Failed to delete resumes", "Please try again.")
      setIsDeleting(false)
    }
  }

  const displayResumes = resumes.slice(0, MAX_DISPLAY)
  const remaining = resumes.length - MAX_DISPLAY

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <Heading3>
          Delete {resumes.length} resume{resumes.length > 1 ? "s" : ""}?
        </Heading3>
        <p className="text-sm leading-6 text-gray-600">
          This will permanently delete the following and cannot be undone.
        </p>
      </div>

      <div className="max-h-60 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm">
        <ul className="flex flex-col gap-1">
          {displayResumes.map((resume) => (
            <li key={resume.id} className="truncate font-medium text-gray-900">
              {resume.title}
            </li>
          ))}
          {remaining > 0 && <li className="text-gray-500">+ {remaining} more...</li>}
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
            : `Delete ${resumes.length} resume${resumes.length > 1 ? "s" : ""}`}
        </Button>
      </div>
    </div>
  )
}
