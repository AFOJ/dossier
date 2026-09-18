import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  Add01Icon,
  ArrowDown01Icon,
  ArrowDownIcon,
  ArrowUp01Icon,
  DragDropHorizontalIcon,
  Trash,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useState, type ReactNode } from "react"
import { Button } from "@/components/ui"
import { cn } from "@/utils"

type SectionCardProps = {
  id: string
  label: string
  hasErrors?: boolean
  onRemove: () => void
  children: ReactNode
}

export function SectionCard(props: Readonly<SectionCardProps>) {
  const { id, label, hasErrors = false, onRemove, children } = props

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  })

  const [bodyId] = useState(() => `section-body-${crypto.randomUUID()}`)
  const [isOpen, setIsOpen] = useState(true)

  const [prevHasErrors, setPrevHasErrors] = useState(hasErrors)
  if (prevHasErrors !== hasErrors) {
    setPrevHasErrors(hasErrors)
    if (hasErrors) {
      setIsOpen(true)
    }
  }

  return (
    <div
      ref={setNodeRef}
      data-row=""
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex flex-col rounded-[10px] border border-gray-200 bg-white",
        hasErrors && "border-red-300",
        isDragging && "relative z-10 opacity-50 shadow-md ring-1 ring-gray-300",
      )}
    >
      <div className="flex items-center gap-2 p-4 pb-3">
        <button
          type="button"
          {...attributes}
          {...listeners}
          onClick={(event) => event.stopPropagation()}
          aria-label={`Reorder ${label} section`}
          className={cn(
            "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]",
            "text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600",
            "focus:outline-none focus:ring-1 focus:ring-gray-600",
            "cursor-grab touch-none active:cursor-grabbing",
          )}
        >
          <HugeiconsIcon icon={DragDropHorizontalIcon} aria-hidden size={18} />
        </button>

        <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-900">{label}</span>

        <div className="flex items-center gap-1">
          <Button
            type="button"
            intent="secondary"
            iconClassname="text-gray-500 hover:text-red-500"
            icon={Trash}
            onClick={onRemove}
            aria-label={`Remove ${label} section`}
            className="w-9 px-0"
          />
          <Button
            type="button"
            intent="secondary"
            icon={ArrowDownIcon}
            iconClassname={cn("transition-transform duration-200", isOpen && "rotate-180")}
            onClick={() => setIsOpen((open) => !open)}
            aria-label={`${isOpen ? "Collapse" : "Expand"} ${label} section`}
            aria-expanded={isOpen}
            aria-controls={bodyId}
            className="w-9 px-0"
          />
        </div>
      </div>

      <div id={bodyId} hidden={!isOpen} className="flex flex-col gap-4 px-4 pb-4">
        {children}
      </div>
    </div>
  )
}

export type ItemControlsProps = {
  label: string
  index: number
  isFirst: boolean
  isLast: boolean
  onMove: (from: number, to: number) => void
  onRemove: () => void
  className?: string
}

export function ItemControls(props: Readonly<ItemControlsProps>) {
  const { label, index, isFirst, isLast, onMove, onRemove, className } = props

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Button
        type="button"
        intent="secondary"
        icon={ArrowUp01Icon}
        disabled={isFirst}
        onClick={() => onMove(index, index - 1)}
        aria-label={`Move ${label} up`}
      />
      <Button
        type="button"
        intent="secondary"
        icon={ArrowDown01Icon}
        disabled={isLast}
        onClick={() => onMove(index, index + 1)}
        aria-label={`Move ${label} down`}
      />
      <Button
        type="button"
        intent="secondary"
        iconClassname="text-gray-500 hover:text-red-500"
        icon={Trash}
        onClick={onRemove}
        aria-label={`Remove ${label}`}
      />
    </div>
  )
}

type AddItemButtonProps = {
  label: string
  onAdd: () => void
}

export function AddItemButton(props: Readonly<AddItemButtonProps>) {
  return (
    <Button
      type="button"
      intent="secondary"
      icon={Add01Icon}
      iconClassname="text-gray-400"
      className="self-start"
      onClick={props.onAdd}
    >
      {props.label}
    </Button>
  )
}
