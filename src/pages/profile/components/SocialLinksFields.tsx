import { useLayoutEffect, useRef } from "react"
import { Add01Icon, DragDropHorizontalIcon, Trash } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
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
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Button, Field, Heading2, Input, Tooltip } from "@/components/ui"
import { useFieldArray, useWatch } from "react-hook-form"
import { useProfileFieldContext } from "@/pages/profile/schema"
import { useFocusLastRow } from "@/hooks/useFocusLastRow"
import { cn } from "@/utils"

export function SocialLinksFields({
  headingClassName,
  showLabels = false,
  hideLabels = false,
}: Readonly<{ headingClassName?: string; showLabels?: boolean; hideLabels?: boolean }>) {
  const { control } = useProfileFieldContext()
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "socials",
  })
  const socials = useWatch({ control, name: "socials" })
  const containerRef = useFocusLastRow(fields.length)
  const addButtonRef = useRef<HTMLButtonElement>(null)
  const pendingFocus = useRef<string | null>(null)

  useLayoutEffect(() => {
    if (pendingFocus.current === null) return
    const nextRow = Array.from(
      containerRef.current?.querySelectorAll<HTMLElement>("[data-link-id]") ?? [],
    ).find((row) => row.dataset.linkId === pendingFocus.current)
    const target = nextRow?.querySelector<HTMLInputElement>("input") ?? addButtonRef.current
    pendingFocus.current = null
    target?.focus()
  }, [fields, containerRef])

  const removeLink = (index: number) => {
    pendingFocus.current = fields[index + 1]?.id ?? fields[index - 1]?.id ?? "add"
    remove(index)
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const findIndexById = (id: string) => fields.findIndex((field) => field.id === id)

  const describe = (id: UniqueIdentifier): string => {
    const index = findIndexById(String(id))
    if (index < 0) return "link"
    return socials?.[index]?.label?.trim() || `link ${index + 1}`
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const fromIndex = findIndexById(String(active.id))
      const targetIndex = findIndexById(String(over.id))
      if (fromIndex >= 0 && targetIndex >= 0) {
        move(fromIndex, targetIndex)
      }
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Heading2 className={headingClassName}>Social links</Heading2>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis, restrictToParentElement]}
        onDragEnd={handleDragEnd}
        accessibility={{
          screenReaderInstructions: {
            draggable:
              "To reorder a link, press Space. Use the up and down arrow keys to move it, then press Space to drop it, or Escape to cancel.",
          },
          announcements: {
            onDragStart: ({ active }) =>
              `Grabbed ${describe(active.id)}. Use arrow keys to move it, then press Space to drop.`,
            onDragOver: ({ active, over }) =>
              over
                ? `${describe(active.id)} was moved over ${describe(over.id)}, position ${findIndexById(String(over.id)) + 1} of ${fields.length}`
                : undefined,
            onDragEnd: ({ active, over }) =>
              over ? `${describe(active.id)} was dropped over ${describe(over.id)}` : undefined,
            onDragCancel: ({ active }) => `Reorder of ${describe(active.id)} was cancelled.`,
          },
        }}
      >
        <SortableContext
          items={fields.map((field) => field.id)}
          strategy={verticalListSortingStrategy}
        >
          <div ref={containerRef} className="flex flex-col gap-3">
            {hideLabels && fields.length > 0 && (
              <div
                aria-hidden="true"
                className="hidden grid-cols-[auto_auto_minmax(0,1fr)] gap-x-2 sm:grid"
              >
                <span className="w-9" />
                <span className="w-9" />
                <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] gap-3 text-sm font-medium">
                  <span>Label</span>
                  <span>URL</span>
                </div>
              </div>
            )}
            {fields.map((field, index) => (
              <SocialLinkRow
                key={field.id}
                id={field.id}
                index={index}
                onRemove={() => removeLink(index)}
                showLabels={showLabels}
                hideLabels={hideLabels}
              />
            ))}

            {showLabels && fields.length > 0 && <hr className="my-1 border-gray-200" />}

            <Button
              type="button"
              ref={addButtonRef}
              icon={Add01Icon}
              intent="secondary"
              iconClassname="text-gray-400"
              className="self-start"
              onClick={() => append({ label: "", url: "" })}
            >
              Add social link
            </Button>
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}

type SocialLinkRowProps = {
  id: string
  index: number
  onRemove: () => void
  showLabels: boolean
  hideLabels: boolean
}

function SocialLinkRow(props: Readonly<SocialLinkRowProps>) {
  const { id, index, onRemove, showLabels, hideLabels } = props
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
  })
  const {
    register,
    control,
    formState: { errors },
  } = useProfileFieldContext()

  const label = useWatch({ control, name: `socials.${index}.label` })
  const rowName = label?.trim() || `link ${index + 1}`
  const fieldErrors = errors.socials?.[index]

  const actions = (
    <>
      <Tooltip content={`Reorder ${rowName}`}>
        <button
          ref={setActivatorNodeRef}
          type="button"
          {...attributes}
          {...listeners}
          onClick={(event) => event.stopPropagation()}
          aria-label={`Reorder ${showLabels ? rowName : `link ${index + 1}`}`}
          className={cn(
            "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px]",
            "text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600",
            "focus:outline-none focus:ring-1 focus:ring-gray-600",
            "cursor-grab touch-none active:cursor-grabbing",
            showLabels &&
              "col-start-1 row-start-1 size-9 border border-gray-400/40 bg-white text-gray-500 hover:bg-gray-50 focus:ring-offset-1",
            showLabels && "mt-7",
            hideLabels && "mt-0 size-11 sm:size-9",
          )}
        >
          <HugeiconsIcon icon={DragDropHorizontalIcon} size={16} aria-hidden />
        </button>
      </Tooltip>

      <Tooltip content={`Remove ${rowName}`}>
        <Button
          type="button"
          intent="secondary"
          iconClassname="text-gray-500 hover:text-red-500"
          icon={Trash}
          onClick={onRemove}
          aria-label={`Remove ${showLabels ? rowName : `link ${index + 1}`}`}
          className={cn(
            "w-9 shrink-0 px-0",
            showLabels && "col-start-2 row-start-1",
            showLabels && "mt-7",
            hideLabels && "mt-0 size-11 sm:size-9",
          )}
        />
      </Tooltip>
    </>
  )

  return (
    <div
      ref={setNodeRef}
      data-row=""
      data-link-id={id}
      role={showLabels ? "group" : undefined}
      aria-label={showLabels ? rowName : undefined}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        showLabels
          ? "grid grid-cols-[auto_auto_minmax(0,1fr)] items-start gap-x-2 gap-y-3"
          : "flex items-center gap-2",
        hideLabels && "rounded-xl border border-gray-200 p-3 sm:rounded-none sm:border-0 sm:p-0",
        isDragging && "relative z-10 opacity-50",
      )}
    >
      {actions}

      <div
        className={cn(
          "min-w-0 flex-1",
          showLabels
            ? "col-start-3 row-start-1 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]"
            : "flex flex-col gap-2 sm:flex-row",
          hideLabels &&
            "col-span-3 col-start-1 row-start-2 sm:col-span-1 sm:col-start-3 sm:row-start-1",
        )}
      >
        <div className="min-w-0 flex-1">
          <Field
            className={hideLabels ? "sm:[&>label]:sr-only" : undefined}
            label={showLabels ? "Label" : undefined}
            inputId={`socials.${index}.label`}
            error={fieldErrors?.label?.message}
          >
            <Input
              id={`socials.${index}.label`}
              placeholder="Label (e.g. GitHub)"
              aria-invalid={fieldErrors?.label ? true : undefined}
              {...register(`socials.${index}.label`)}
            />
          </Field>
        </div>

        <div className="min-w-0 flex-1">
          <Field
            className={hideLabels ? "sm:[&>label]:sr-only" : undefined}
            label={showLabels ? "URL" : undefined}
            inputId={`socials.${index}.url`}
            error={fieldErrors?.url?.message}
          >
            <Input
              id={`socials.${index}.url`}
              placeholder="URL"
              aria-invalid={fieldErrors?.url ? true : undefined}
              {...register(`socials.${index}.url`)}
            />
          </Field>
        </div>
      </div>
    </div>
  )
}
