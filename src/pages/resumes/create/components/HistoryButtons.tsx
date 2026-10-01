import { ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons"
import { Button, Tooltip } from "@/components/ui"

type HistoryButtonsProps = {
  canUndo: boolean
  canRedo: boolean
  undoLabel: string | null
  redoLabel: string | null
  onUndo: () => void
  onRedo: () => void
  disabled?: boolean
}

export function HistoryButtons(props: Readonly<HistoryButtonsProps>) {
  const { canUndo, canRedo, undoLabel, redoLabel, onUndo, onRedo, disabled = false } = props

  const undoContent = canUndo && undoLabel ? `Undo ${undoLabel}` : "Nothing to undo"
  const redoContent = canRedo && redoLabel ? `Redo ${redoLabel}` : "Nothing to redo"

  return (
    <div className="flex items-center gap-2">
      <Tooltip content={undoContent}>
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

      <Tooltip content={redoContent}>
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
