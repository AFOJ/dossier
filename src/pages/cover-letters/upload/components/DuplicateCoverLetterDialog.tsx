import { useState } from "react"
import { Button, Heading3 } from "@/components/ui"
import type { ModalContentProps } from "@/components/modal"
import type { CoverLetter } from "@/db/db"

interface DuplicateCoverLetterDialogData {
  existingLetter: CoverLetter
  incomingLetter: CoverLetter
  incomingLetterId: string
  onOverwrite: () => Promise<void>
  onCreateCopy: () => Promise<void>
}

export function DuplicateCoverLetterDialog({
  data,
  close,
}: Readonly<ModalContentProps<DuplicateCoverLetterDialogData>>) {
  const { existingLetter, incomingLetter, incomingLetterId, onOverwrite, onCreateCopy } = data
  const [busyAction, setBusyAction] = useState<"overwrite" | "copy" | null>(null)
  const isBusy = busyAction !== null

  const handleOverwrite = async () => {
    setBusyAction("overwrite")
    try {
      await onOverwrite()
      close()
    } catch {
      setBusyAction(null)
    }
  }

  const handleCreateCopy = async () => {
    setBusyAction("copy")
    try {
      await onCreateCopy()
      close()
    } catch {
      setBusyAction(null)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <Heading3>Cover letter already exists</Heading3>
        <p className="text-sm leading-6 text-gray-600">
          A cover letter with the ID{" "}
          <span className="font-medium text-gray-900">{incomingLetterId}</span> already exists.
        </p>
        <p className="text-sm leading-6 text-gray-600">
          Existing: <span className="font-medium text-gray-900">{existingLetter.title}</span>
        </p>
        <p className="text-sm leading-6 text-gray-600">
          Incoming: <span className="font-medium text-gray-900">{incomingLetter.title}</span>
        </p>
      </div>

      <div className="flex flex-wrap justify-end gap-2">
        <Button intent="secondary" onClick={close} autoFocus disabled={isBusy}>
          Cancel
        </Button>
        <Button intent="secondary" onClick={handleCreateCopy} disabled={isBusy}>
          {busyAction === "copy" ? "Importing…" : "Create Copy"}
        </Button>
        <Button onClick={handleOverwrite} disabled={isBusy}>
          {busyAction === "overwrite" ? "Overwriting…" : "Overwrite"}
        </Button>
      </div>
    </div>
  )
}
