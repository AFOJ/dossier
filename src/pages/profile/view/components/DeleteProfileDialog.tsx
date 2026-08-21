import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Heading3 } from '@/components/ui'
import type { ModalContentProps } from '@/components/modal'
import { deleteProfile } from '@/db/profile'

export function DeleteProfileDialog({
  close,
}: Readonly<ModalContentProps<undefined>>) {
  const [isDeleting, setIsDeleting] = useState(false)
  const navigate = useNavigate()

  const handleDelete = async () => {
    setIsDeleting(true)

    try {
      await deleteProfile()
      navigate('/setup')
    } catch (error) {
      setIsDeleting(false)
      console.error('Failed to delete profile:', error)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <Heading3>Delete profile?</Heading3>
        <p className="text-sm leading-6 text-gray-600">
          This will permanently delete your profile and{' '}
          <span className="font-medium text-gray-900">all of your resumes</span>
          . You will be redirected to the setup flow and this cannot be undone.
        </p>
      </div>

      <div className="flex flex-wrap justify-end gap-2">
        <Button
          type="button"
          intent="secondary"
          onClick={close}
          disabled={isDeleting}
          autoFocus
        >
          Cancel
        </Button>
        <Button
          type="button"
          onClick={handleDelete}
          disabled={isDeleting}
          className="bg-red-700 enabled:hover:bg-red-800 focus:ring-red-500"
        >
          {isDeleting ? 'Deleting...' : 'Delete profile'}
        </Button>
      </div>
    </div>
  )
}
