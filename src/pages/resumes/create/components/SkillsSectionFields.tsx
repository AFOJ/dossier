import type { SkillGroup } from "@/db/types"
import { Field, Input, TagInput, Button } from "@/components/ui"
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
} from "@dnd-kit/sortable"
import {
  getSectionErrors,
  useResumeFieldContext,
  itemKey,
  withKey,
  type SkillsSectionErrors,
  type ResumeFormData,
} from "@/pages/resumes/create/hooks/useCreateResumeForm"
import { HugeiconsIcon } from "@hugeicons/react"
import { DragDropHorizontalIcon, ArrowDownIcon, Trash } from "@hugeicons/core-free-icons"
import { useState, memo } from "react"
import { CSS } from "@dnd-kit/utilities"
import { useSortable } from "@dnd-kit/sortable"
import { cn } from "@/utils"

type GroupItem = SkillGroup

type SortableGroupCardProps = {
  id: string
  label: string
  hasErrors: boolean
  onRemove: () => void
  children: React.ReactNode
}

function SortableGroupCard(props: Readonly<SortableGroupCardProps>) {
  const { id, label, hasErrors, onRemove, children } = props

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  })

  const [bodyId] = useState(() => `group-body-${crypto.randomUUID()}`)
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
          aria-label={`Reorder ${label} group`}
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
            aria-label={`Remove ${label} group`}
            className="w-9 px-0"
          />
          <Button
            type="button"
            intent="secondary"
            icon={ArrowDownIcon}
            iconClassname={cn("transition-transform duration-200", isOpen && "rotate-180")}
            onClick={() => setIsOpen((open) => !open)}
            aria-label={`${isOpen ? "Collapse" : "Expand"} ${label} group`}
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

type GroupRowProps = {
  sectionIndex: number
  group: GroupItem
  index: number
  onChange: (group: GroupItem) => void
  onRemove: () => void
}

function GroupRowImpl(props: Readonly<GroupRowProps>) {
  const { sectionIndex, group, index, onChange, onRemove } = props

  const {
    formState: { errors },
  } = useResumeFieldContext()

  const sectionErrors = getSectionErrors(errors, sectionIndex) as SkillsSectionErrors | undefined
  const groupErrors = sectionErrors?.groups?.[index]
  const hasErrors = groupErrors !== undefined

  const label = group.title?.trim() || `Untitled Group`

  return (
    <SortableGroupCard
      id={itemKey(group, index)}
      label={label}
      hasErrors={hasErrors}
      onRemove={onRemove}
    >
      <Field
        label="Group title"
        inputId={`section-${sectionIndex}-group-title-${index}`}
        required
        error={groupErrors?.title?.message}
      >
        <Input
          id={`section-${sectionIndex}-group-title-${index}`}
          placeholder="Soft Skills"
          aria-invalid={groupErrors?.title ? true : undefined}
          value={group.title}
          onChange={(event) => onChange({ ...group, title: event.target.value })}
        />
      </Field>

      <Field
        label="Skills"
        inputId={`section-${sectionIndex}-group-items-${index}`}
        required
        error={groupErrors?.items?.message}
      >
        <TagInput
          ariaLabel={`Skills for group ${index + 1}`}
          value={group.items}
          onChange={(items) => onChange({ ...group, items })}
        />
      </Field>
    </SortableGroupCard>
  )
}

const GroupRow = memo(GroupRowImpl)

type GroupsEditorProps = {
  sectionIndex: number
  groups: GroupItem[]
  onChange: (groups: GroupItem[]) => void
  clearErrors: UseFormClearErrors<ResumeFormData>
}

export function GroupsEditor(props: Readonly<GroupsEditorProps>) {
  const { sectionIndex, groups, onChange, clearErrors } = props

  const {
    formState: { errors },
  } = useResumeFieldContext()

  const sectionErrors = getSectionErrors(errors, sectionIndex) as SkillsSectionErrors | undefined
  const sectionError = sectionErrors?.groups?.message

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const findIndexById = (id: string) => groups.findIndex((group, i) => itemKey(group, i) === id)

  const describe = (id: UniqueIdentifier): string => {
    const key = String(id)
    const index = findIndexById(key)
    if (index < 0) return "group"
    const group = groups[index]
    return group.title?.trim() || "Untitled Group"
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const fromIndex = findIndexById(String(active.id))
      const targetIndex = findIndexById(String(over.id))
      if (fromIndex >= 0 && targetIndex >= 0) {
        onChange(arrayMove(groups, fromIndex, targetIndex))
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
              ? `${describe(active.id)} was moved over ${describe(over.id)}, position ${findIndexById(String(over.id)) + 1} of ${groups.length}`
              : undefined,
          onDragEnd: ({ active, over }) =>
            over ? `${describe(active.id)} was dropped over ${describe(over.id)}` : undefined,
          onDragCancel: ({ active }) => `Reorder of ${describe(active.id)} was cancelled.`,
        },
      }}
    >
      <SortableContext
        items={groups.map((group, i) => itemKey(group, i))}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col gap-3">
          {sectionError && (
            <p role="alert" className="text-sm text-red-700">
              {sectionError}
            </p>
          )}

          {groups.map((group, index) => (
            <GroupRow
              key={itemKey(group, index)}
              sectionIndex={sectionIndex}
              group={group}
              index={index}
              onChange={(next) =>
                onChange(groups.map((current, i) => (i === index ? next : current)))
              }
              onRemove={() => {
                clearErrors(`sections.${sectionIndex}.groups.${index}`)
                onChange(groups.filter((_, i) => i !== index))
              }}
            />
          ))}

          <AddItemButton
            label="Add skill group"
            onAdd={() => onChange([...groups, withKey({ title: "", items: [] })])}
          />
        </div>
      </SortableContext>
    </DndContext>
  )
}
