import type { EducationalInstitution } from "@/db/types"
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
  type EducationSectionErrors,
  type ResumeFormData,
} from "@/pages/resumes/create/hooks/useCreateResumeForm"
import { HugeiconsIcon } from "@hugeicons/react"
import { DragDropHorizontalIcon, ArrowDownIcon, Trash } from "@hugeicons/core-free-icons"
import { useState, memo } from "react"
import { CSS } from "@dnd-kit/utilities"
import { cn } from "@/utils"

type SortableInstitutionCardProps = {
  id: string
  label: string
  hasErrors: boolean
  onRemove: () => void
  children: React.ReactNode
}

function SortableInstitutionCard(props: Readonly<SortableInstitutionCardProps>) {
  const { id, label, hasErrors, onRemove, children } = props

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  })

  const [bodyId] = useState(() => `institution-body-${crypto.randomUUID()}`)
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
          aria-label={`Reorder ${label} institution`}
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
            aria-label={`Remove ${label} institution`}
            className="w-9 px-0"
          />
          <Button
            type="button"
            intent="secondary"
            icon={ArrowDownIcon}
            iconClassname={cn("transition-transform duration-200", isOpen && "rotate-180")}
            onClick={() => setIsOpen((open) => !open)}
            aria-label={`${isOpen ? "Collapse" : "Expand"} ${label} institution`}
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

type InstitutionRowProps = {
  sectionIndex: number
  institution: EducationalInstitution
  index: number
  onChange: (institution: EducationalInstitution) => void
  onRemove: () => void
  clearErrors: UseFormClearErrors<ResumeFormData>
}

function InstitutionRowImpl(props: Readonly<InstitutionRowProps>) {
  const { sectionIndex, institution, index, onChange, onRemove, clearErrors } = props

  const {
    formState: { errors },
  } = useResumeFieldContext()

  const sectionErrors = getSectionErrors(errors, sectionIndex) as EducationSectionErrors | undefined
  const institutionErrors = sectionErrors?.institutions?.[index]
  const hasErrors = institutionErrors !== undefined

  const label = institution.name?.trim() || "Untitled Institution"

  const update = (patch: Partial<EducationalInstitution>) => onChange({ ...institution, ...patch })

  return (
    <SortableInstitutionCard
      id={itemKey(institution, index)}
      label={label}
      hasErrors={hasErrors}
      onRemove={() => {
        clearErrors(`sections.${sectionIndex}.institutions.${index}`)
        onRemove()
      }}
    >
      <Field
        label="School"
        inputId={`section-${sectionIndex}-school-${index}`}
        required
        error={institutionErrors?.name?.message}
      >
        <Input
          id={`section-${sectionIndex}-school-${index}`}
          placeholder="University of London"
          aria-invalid={institutionErrors?.name ? true : undefined}
          value={institution.name}
          onChange={(event) => update({ name: event.target.value })}
        />
      </Field>

      <Field
        label="Degree"
        inputId={`section-${sectionIndex}-degree-${index}`}
        required
        error={institutionErrors?.degree?.message}
      >
        <Input
          id={`section-${sectionIndex}-degree-${index}`}
          placeholder="BSc Computer Science"
          aria-invalid={institutionErrors?.degree ? true : undefined}
          value={institution.degree}
          onChange={(event) => update({ degree: event.target.value })}
        />
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Grade" inputId={`section-${sectionIndex}-grade-${index}`}>
          <Input
            id={`section-${sectionIndex}-grade-${index}`}
            placeholder="First Class Honours"
            value={institution.grade ?? ""}
            onChange={(event) =>
              update({
                grade: event.target.value.trim() === "" ? undefined : event.target.value,
              })
            }
          />
        </Field>

        <Field label="Location" inputId={`section-${sectionIndex}-education-location-${index}`}>
          <Input
            id={`section-${sectionIndex}-education-location-${index}`}
            placeholder="London, UK"
            value={institution.location}
            onChange={(event) => update({ location: event.target.value })}
          />
        </Field>

        <Field label="Start date" inputId={`section-${sectionIndex}-education-start-${index}`}>
          <Input
            id={`section-${sectionIndex}-education-start-${index}`}
            placeholder="2015"
            value={institution.start_date}
            onChange={(event) => update({ start_date: event.target.value })}
          />
        </Field>

        <Field label="End date" inputId={`section-${sectionIndex}-education-end-${index}`}>
          <Input
            id={`section-${sectionIndex}-education-end-${index}`}
            placeholder="2019"
            value={institution.end_date}
            onChange={(event) => update({ end_date: event.target.value })}
          />
        </Field>
      </div>

      <Field
        label="Paragraph"
        inputId={`section-${sectionIndex}-education-paragraph-${index}`}
        description="Anything else worth highlighting about this."
      >
        <Textarea
          id={`section-${sectionIndex}-education-paragraph-${index}`}
          rows={3}
          value={institution.paragraph ?? ""}
          onChange={(event) =>
            update({
              paragraph: event.target.value.trim() === "" ? undefined : event.target.value,
            })
          }
        />
      </Field>
    </SortableInstitutionCard>
  )
}

const InstitutionRow = memo(InstitutionRowImpl)

type InstitutionsEditorProps = {
  sectionIndex: number
  institutions: EducationalInstitution[]
  onChange: (institutions: EducationalInstitution[]) => void
  clearErrors: UseFormClearErrors<ResumeFormData>
}

export function InstitutionsEditor(props: Readonly<InstitutionsEditorProps>) {
  const { sectionIndex, institutions, onChange, clearErrors } = props

  const {
    formState: { errors },
  } = useResumeFieldContext()

  const sectionErrors = getSectionErrors(errors, sectionIndex) as EducationSectionErrors | undefined
  const sectionError = sectionErrors?.institutions?.message

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const findIndexById = (id: string) => institutions.findIndex((inst, i) => itemKey(inst, i) === id)

  const describe = (id: UniqueIdentifier): string => {
    const key = String(id)
    const index = findIndexById(key)
    if (index < 0) return "institution"
    const inst = institutions[index]
    return inst.name?.trim() || "Untitled Institution"
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const fromIndex = findIndexById(String(active.id))
      const targetIndex = findIndexById(String(over.id))
      if (fromIndex >= 0 && targetIndex >= 0) {
        onChange(arrayMove(institutions, fromIndex, targetIndex))
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
              ? `${describe(active.id)} was moved over ${describe(over.id)}, position ${findIndexById(String(over.id)) + 1} of ${institutions.length}`
              : undefined,
          onDragEnd: ({ active, over }) =>
            over ? `${describe(active.id)} was dropped over ${describe(over.id)}` : undefined,
          onDragCancel: ({ active }) => `Reorder of ${describe(active.id)} was cancelled.`,
        },
      }}
    >
      <SortableContext
        items={institutions.map((inst, i) => itemKey(inst, i))}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col gap-3">
          {sectionError && (
            <p role="alert" className="text-sm text-red-700">
              {sectionError}
            </p>
          )}

          {institutions.map((institution, index) => (
            <InstitutionRow
              key={itemKey(institution, index)}
              sectionIndex={sectionIndex}
              institution={institution}
              index={index}
              onChange={(next) =>
                onChange(institutions.map((current, i) => (i === index ? next : current)))
              }
              onRemove={() => {
                clearErrors(`sections.${sectionIndex}.institutions.${index}`)
                onChange(institutions.filter((_, i) => i !== index))
              }}
              clearErrors={clearErrors}
            />
          ))}

          <AddItemButton
            label="Add school"
            onAdd={() =>
              onChange([
                ...institutions,
                withKey({
                  name: "",
                  degree: "",
                  start_date: "",
                  end_date: "",
                  location: "",
                }),
              ])
            }
          />
        </div>
      </SortableContext>
    </DndContext>
  )
}
