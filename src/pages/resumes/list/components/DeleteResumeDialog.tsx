import { useState } from 'react'
import { Button, Heading3 } from '@/components/ui'
import type { ModalContentProps } from '@/components/modal'
import type { Resume } from '@/db/db'
import { deleteResume } from '@/db/resume'

export function DeleteResumeDialog({
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
