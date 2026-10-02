import { ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons"
import { Button, Tooltip } from "@/components/ui"

type HistoryButtonsProps = {
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
  disabled?: boolean
}

export function HistoryButtons(props: Readonly<HistoryButtonsProps>) {
  const { canUndo, canRedo, onUndo, onRedo, disabled = false } = props

  return (
    <div className="flex items-center gap-2">
      <Tooltip content={canUndo ? "Undo" : "Nothing to undo"}>
        <span className="inline-block">
          <Button
            type="button"
            intent="secondary"
            icon={ArrowLeft01Icon}
            iconClassname="text-gray-500"
            aria-label="Undo"
            disabled={!canUndo || disabled}
            onClick={onUndo}
            className="size-8 p-0"
          />
        </span>
      </Tooltip>

      <Tooltip content={canRedo ? "Redo" : "Nothing to redo"}>
        <span className="inline-block">
          <Button
            type="button"
            intent="secondary"
            icon={ArrowRight01Icon}
            iconClassname="text-gray-500"
            aria-label="Redo"
            disabled={!canRedo || disabled}
            onClick={onRedo}
            className="size-8 p-0"
          />
        </span>
      </Tooltip>
    </div>
  )
}
