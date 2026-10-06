import { Button, Heading3 } from "@/components/ui"
import type { ModalContentProps } from "@/components/modal"

export interface UnsavedChangesDialogData {
  onStay: () => void
  onLeave: () => void
}

export function UnsavedChangesDialog({
  data: { onStay, onLeave },
}: Readonly<ModalContentProps<UnsavedChangesDialogData>>) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <Heading3>Discard unsaved changes?</Heading3>
        <p className="text-sm leading-6 text-gray-600">
          This document has changes that haven&apos;t been saved yet. Leaving this page will discard{" "}
          <span className="font-medium text-gray-900">them permanently</span>.
        </p>
      </div>

      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" intent="secondary" onClick={onStay} autoFocus>
          Stay on this page
        </Button>
        <Button
          type="button"
          onClick={onLeave}
          className="bg-red-700 enabled:hover:bg-red-800 focus:ring-red-500"
        >
          Discard and leave
        </Button>
      </div>
    </div>
  )
}
