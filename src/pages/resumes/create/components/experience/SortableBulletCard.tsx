import { HugeiconsIcon } from "@hugeicons/react"
import { DragDropHorizontalIcon, ArrowDownIcon, Trash } from "@hugeicons/core-free-icons"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { useState, type ReactNode } from "react"
import { Button } from "@/components/ui"
import { cn } from "@/utils"

type SortableBulletCardProps = {
  id: string
  label: string
  hasErrors: boolean
  onRemove: () => void
  children: ReactNode
}

export function SortableBulletCard(props: Readonly<SortableBulletCardProps>) {
  const { id, label, hasErrors, onRemove, children } = props

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  })

  const [bodyId] = useState(() => `bullet-body-${crypto.randomUUID()}`)
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
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex flex-col rounded-[10px] border border-gray-200 bg-white",
        hasErrors && "border-red-300",
        isDragging && "opacity-50 shadow-md ring-1 ring-gray-300",
      )}
    >
      <div className="flex items-center gap-2 p-3 pb-2">
        <button
          type="button"
          {...attributes}
          {...listeners}
          onClick={(event) => event.stopPropagation()}
          aria-label={`Reorder ${label} bullet`}
          className={cn(
            "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px]",
            "text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600",
            "focus:outline-none focus:ring-1 focus:ring-gray-600",
            "cursor-grab touch-none active:cursor-grabbing",
          )}
        >
          <HugeiconsIcon icon={DragDropHorizontalIcon} size={16} aria-hidden />
        </button>

        <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-900">{label}</span>

        <div className="flex items-center gap-1">
          <Button
            type="button"
            intent="secondary"
            iconClassname="text-gray-500 hover:text-red-500"
            icon={Trash}
            onClick={onRemove}
            aria-label={`Remove ${label} bullet`}
            className="w-9 px-0"
          />
          <Button
            type="button"
            intent="secondary"
            icon={ArrowDownIcon}
            iconClassname={cn("transition-transform duration-200", isOpen && "rotate-180")}
            onClick={() => setIsOpen((open) => !open)}
            aria-label={`${isOpen ? "Collapse" : "Expand"} ${label} bullet`}
            aria-expanded={isOpen}
            aria-controls={bodyId}
            className="w-9 px-0"
          />
        </div>
      </div>

      <div id={bodyId} hidden={!isOpen} className="flex flex-col gap-3 px-3 pb-3">
        {children}
      </div>
    </div>
  )
}
