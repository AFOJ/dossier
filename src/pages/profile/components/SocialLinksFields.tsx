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
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Button, Field, Heading2, Input } from "@/components/ui"
import { useFieldArray, useWatch } from "react-hook-form"
import { useProfileFieldContext } from "@/pages/profile/schema"
import { cn } from "@/utils"

export function SocialLinksFields() {
  const { control } = useProfileFieldContext()
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "socials",
  })
  const socials = useWatch({ control, name: "socials" })

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
      <Heading2>Social links</Heading2>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        accessibility={{
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
          <div className="flex flex-col gap-3">
            {fields.map((field, index) => (
              <SocialLinkRow
                key={field.id}
                id={field.id}
                index={index}
                onRemove={() => remove(index)}
              />
            ))}

            <Button
              type="button"
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
}

function SocialLinkRow(props: Readonly<SocialLinkRowProps>) {
  const { id, index, onRemove } = props
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  })
  const {
    register,
    formState: { errors },
  } = useProfileFieldContext()

  const fieldErrors = errors.socials?.[index]

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("flex items-center gap-2", isDragging && "opacity-50")}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        onClick={(event) => event.stopPropagation()}
        aria-label={`Reorder link ${index + 1}`}
        className={cn(
          "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px]",
          "text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600",
          "focus:outline-none focus:ring-1 focus:ring-gray-600",
          "cursor-grab touch-none active:cursor-grabbing",
        )}
      >
        <HugeiconsIcon icon={DragDropHorizontalIcon} size={16} aria-hidden />
      </button>

      <Button
        type="button"
        intent="secondary"
        iconClassname="text-gray-500 hover:text-red-500"
        icon={Trash}
        onClick={onRemove}
        aria-label={`Remove link ${index + 1}`}
        className="w-9 shrink-0 px-0"
      />

      <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row">
        <div className="min-w-0 flex-1">
          <Field inputId={`socials.${index}.label`} error={fieldErrors?.label?.message}>
            <Input
              id={`socials.${index}.label`}
              placeholder="Label (e.g. GitHub)"
              aria-invalid={fieldErrors?.label ? true : undefined}
              {...register(`socials.${index}.label`)}
            />
          </Field>
        </div>

        <div className="min-w-0 flex-1">
          <Field inputId={`socials.${index}.url`} error={fieldErrors?.url?.message}>
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
