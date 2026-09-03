import { Button, Heading3 } from '@/components/ui'
import type { ModalContentProps } from '@/components/modal'
import type { Resume } from '@/db/db'

interface DuplicateResumeDialogData {
  existingResume: Resume
  incomingResume: Resume
  incomingResumeId: string
  onOverwrite: () => void
  onCreateCopy: () => void
}

export function DuplicateResumeDialog({
  data,
  close,
}: Readonly<ModalContentProps<DuplicateResumeDialogData>>) {
  const { existingResume, incomingResume, incomingResumeId, onOverwrite, onCreateCopy } = data

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <Heading3>Resume already exists</Heading3>
        <p className="text-sm leading-6 text-gray-600">
          A resume with the ID <span className="font-medium text-gray-900">{incomingResumeId}</span> already exists.
        </p>
        <p className="text-sm leading-6 text-gray-600">
          Existing: <span className="font-medium text-gray-900">{existingResume.title}</span>
        </p>
        <p className="text-sm leading-6 text-gray-600">
          Incoming: <span className="font-medium text-gray-900">{incomingResume.title}</span>
        </p>
      </div>

      <div className="flex flex-wrap justify-end gap-2">
        <Button
          intent="secondary"
          onClick={close}
          autoFocus
        >
          Cancel
        </Button>
        <Button
          intent="secondary"
          onClick={() => {
            onCreateCopy()
            close()
          }}
        >
          Create Copy
        </Button>
        <Button
          onClick={() => {
            onOverwrite()
            close()
          }}
        >
          Overwrite
        </Button>
      </div>
    </div>
  )
}