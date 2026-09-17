import type { ListItem } from "@/db/types"
import { Field, Input, Textarea, Button } from "@/components/ui"
import { AddItemButton } from "@/pages/resumes/create/components/SectionCard"
import type { UseFormClearErrors } from "react-hook-form"
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core"
import { restrictToParentElement, restrictToVerticalAxis } from "@dnd-kit/modifiers"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
  useSortable,
} from "@dnd-kit/sortable"
import {
  getSectionErrors,
  useResumeFieldContext,
  itemKey,
  withKey,
  type ListSectionErrors,
  type ResumeFormData,
} from "@/pages/resumes/create/hooks/useCreateResumeForm"
import { HugeiconsIcon } from "@hugeicons/react"
import { DragDropHorizontalIcon, ArrowDownIcon, Trash } from "@hugeicons/core-free-icons"
import { useState, memo } from "react"
import { CSS } from "@dnd-kit/utilities"
import { cn } from "@/utils"

type ListItemRowProps = {
  sectionIndex: number
  item: ListItem
  index: number
  onChange: (item: ListItem) => void
  onRemove: () => void
  clearErrors: UseFormClearErrors<ResumeFormData>
}

type SortableListItemCardProps = {
  id: string
  label: string
  hasErrors: boolean
  onRemove: () => void
  children: React.ReactNode
}

function SortableListItemCard(props: Readonly<SortableListItemCardProps>) {
  const { id, label, hasErrors, onRemove, children } = props

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  })

  const [bodyId] = useState(() => `list-item-body-${crypto.randomUUID()}`)
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
        isDragging && "relative z-10 opacity-50 shadow-md ring-1 ring-gray-300",
      )}
    >
      <div className="flex items-center gap-2 p-3 pb-2">
        <button
          type="button"
          {...attributes}
          {...listeners}
          onClick={(event) => event.stopPropagation()}
          aria-label={`Reorder ${label} item`}
          className={cn(
            "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px]",
            "text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600",
            "focus:outline-none focus:ring-1 focus:ring-gray-600",
            "cursor-grab touch-none active:cursor-grabbing",
          )}
        >
          <HugeiconsIcon icon={DragDropHorizontalIcon} aria-hidden size={16} />
        </button>

        <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-900">{label}</span>

        <div className="flex items-center gap-1">
          <Button
            type="button"
            intent="secondary"
            iconClassname="text-gray-500 hover:text-red-500"
            icon={Trash}
            onClick={onRemove}
            aria-label={`Remove ${label} item`}
            className="w-9 px-0"
          />
          <Button
            type="button"
            intent="secondary"
            icon={ArrowDownIcon}
            iconClassname={cn("transition-transform duration-200", isOpen && "rotate-180")}
            onClick={() => setIsOpen((open) => !open)}
            aria-label={`${isOpen ? "Collapse" : "Expand"} ${label} item`}
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

function ListItemRowImpl(props: Readonly<ListItemRowProps>) {
  const { sectionIndex, item, index, onChange, onRemove, clearErrors } = props

  const {
    formState: { errors },
  } = useResumeFieldContext()

  const sectionErrors = getSectionErrors(errors, sectionIndex) as ListSectionErrors | undefined
  const itemErrors = sectionErrors?.items?.[index]
  const hasErrors = itemErrors !== undefined

  const label = item.title?.trim() || "Untitled Item"

  const update = (patch: Partial<ListItem>) => onChange({ ...item, ...patch })

  return (
    <SortableListItemCard
      id={itemKey(item, index)}
      label={label}
      hasErrors={hasErrors}
      onRemove={() => {
        clearErrors(`sections.${sectionIndex}.items.${index}`)
        onRemove()
      }}
    >
      <Field
        label="Title"
        inputId={`section-${sectionIndex}-item-title-${index}`}
        error={itemErrors?.title?.message}
      >
        <Input
          id={`section-${sectionIndex}-item-title-${index}`}
          placeholder="Project name"
          aria-invalid={itemErrors?.title ? true : undefined}
          value={item.title ?? ""}
          onChange={(event) => update({ title: event.target.value })}
        />
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          label="URL"
          inputId={`section-${sectionIndex}-item-url-${index}`}
          error={itemErrors?.url?.message}
        >
          <Input
            id={`section-${sectionIndex}-item-url-${index}`}
            type="url"
            placeholder="https://example.com"
            aria-invalid={itemErrors?.url ? true : undefined}
            value={item.url ?? ""}
            onChange={(event) => update({ url: event.target.value })}
          />
        </Field>

        <Field
          label="Date"
          inputId={`section-${sectionIndex}-item-date-${index}`}
          error={itemErrors?.date?.message}
        >
          <Input
            id={`section-${sectionIndex}-item-date-${index}`}
            placeholder="2024"
            value={item.date ?? ""}
            onChange={(event) => update({ date: event.target.value })}
          />
        </Field>
      </div>

      <Field
        label="Description"
        inputId={`section-${sectionIndex}-item-description-${index}`}
        required
        error={itemErrors?.description?.message}
      >
        <Textarea
          id={`section-${sectionIndex}-item-description-${index}`}
          rows={3}
          placeholder="What was this project about?"
          aria-invalid={itemErrors?.description ? true : undefined}
          value={item.description}
          onChange={(event) => update({ description: event.target.value })}
        />
      </Field>
    </SortableListItemCard>
  )
}

const ListItemRow = memo(ListItemRowImpl)

type ListItemsEditorProps = {
  sectionIndex: number
  items: ListItem[]
  onChange: (items: ListItem[]) => void
  clearErrors: UseFormClearErrors<ResumeFormData>
}

export function ListItemsEditor(props: Readonly<ListItemsEditorProps>) {
  const { sectionIndex, items, onChange, clearErrors } = props

  const {
    formState: { errors },
  } = useResumeFieldContext()

  const sectionErrors = getSectionErrors(errors, sectionIndex) as ListSectionErrors | undefined
  const sectionError = sectionErrors?.items?.message

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const findIndexById = (id: string) => items.findIndex((item, i) => itemKey(item, i) === id)

  const describe = (id: UniqueIdentifier): string => {
    const key = String(id)
    const index = findIndexById(key)
    if (index < 0) {
      return "item"
    }
    const item = items[index]
    return item.title?.trim() || "Untitled Item"
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const fromIndex = findIndexById(String(active.id))
      const targetIndex = findIndexById(String(over.id))
      if (fromIndex >= 0 && targetIndex >= 0) {
        onChange(arrayMove(items, fromIndex, targetIndex))
      }
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis, restrictToParentElement]}
      onDragEnd={handleDragEnd}
      accessibility={{
        announcements: {
          onDragStart: ({ active }) =>
            `Grabbed ${describe(active.id)}. Use arrow keys to move it, then press Space to drop.`,
          onDragOver: ({ active, over }) =>
            over
              ? `${describe(active.id)} was moved over ${describe(over.id)}, position ${findIndexById(String(over.id)) + 1} of ${items.length}`
              : undefined,
          onDragEnd: ({ active, over }) =>
            over ? `${describe(active.id)} was dropped over ${describe(over.id)}` : undefined,
          onDragCancel: ({ active }) => `Reorder of ${describe(active.id)} was cancelled.`,
        },
      }}
    >
      <SortableContext
        items={items.map((item, i) => itemKey(item, i))}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col gap-3">
          {sectionError && (
            <p role="alert" className="text-sm text-red-700">
              {sectionError}
            </p>
          )}

          {items.map((item, index) => (
            <ListItemRow
              key={itemKey(item, index)}
              sectionIndex={sectionIndex}
              item={item}
              index={index}
              onChange={(next) =>
                onChange(items.map((current, i) => (i === index ? next : current)))
              }
              onRemove={() => {
                clearErrors(`sections.${sectionIndex}.items.${index}`)
                onChange(items.filter((_, i) => i !== index))
              }}
              clearErrors={clearErrors}
            />
          ))}

          <AddItemButton
            label="Add item"
            onAdd={() =>
              onChange([...items, withKey({ title: "", url: "", description: "", date: "" })])
            }
          />
        </div>
      </SortableContext>
    </DndContext>
  )
}
