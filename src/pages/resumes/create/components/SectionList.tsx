import { memo, useState } from "react"
import { useWatch, type Control } from "react-hook-form"
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
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { Field, Input } from "@/components/ui"
import type { ResumeSectionData } from "@/db/schemas"
import { SectionCard } from "@/pages/resumes/create/components/SectionCard"
import { SectionFields } from "@/pages/resumes/create/components/SectionFields"
import {
  getSectionErrors,
  useResumeFieldContext,
  itemKey,
  type FormSection,
  type ResumeFormData,
} from "@/pages/resumes/create/hooks/useCreateResumeForm"

type SectionRowProps = {
  section: FormSection
  index: number
  updateSection: (index: number, section: ResumeSectionData) => void
  removeSection: (index: number) => void
  clearErrors: UseFormClearErrors<ResumeFormData>
}

function SectionRowImpl(props: Readonly<SectionRowProps>) {
  const { section, index, updateSection, removeSection, clearErrors } = props

  const {
    formState: { errors },
  } = useResumeFieldContext()

  const sectionErrors = getSectionErrors(errors, index)
  const hasErrors = sectionErrors !== undefined
  const titleError = sectionErrors?.title?.message

  const label =
    section.title?.trim() ||
    `Untitled Section (${section.type.charAt(0).toUpperCase() + section.type.slice(1)})`

  const [titleInputId] = useState(() => `section-title-${crypto.randomUUID()}`)

  return (
    <SectionCard
      id={itemKey(section, index)}
      label={label}
      hasErrors={hasErrors}
      onRemove={() => removeSection(index)}
    >
      <Field label="Section title" inputId={titleInputId} required error={titleError}>
        <Input
          id={titleInputId}
          className="w-full"
          placeholder={`Section title: ${label}`}
          value={section.title ?? ""}
          onChange={(event) => updateSection(index, { ...section, title: event.target.value })}
        />
      </Field>

      <SectionFields
        section={section}
        label={label}
        index={index}
        onChange={(next) => updateSection(index, next)}
        clearErrors={clearErrors}
      />
    </SectionCard>
  )
}

const SectionRow = memo(SectionRowImpl)

type SectionListProps = {
  control: Control<ResumeFormData>
  updateSection: (index: number, section: ResumeSectionData) => void
  reorderSection: (fromIndex: number, targetIndex: number) => void
  removeSection: (index: number) => void
  clearErrors: UseFormClearErrors<ResumeFormData>
}

export function SectionList(props: Readonly<SectionListProps>) {
  const { control, updateSection, reorderSection, removeSection, clearErrors } = props

  const formSections = useWatch({ control, name: "sections" })
  const sections = (formSections ?? []) as FormSection[]

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const findIndexById = (id: string) =>
    sections.findIndex((section, i) => itemKey(section, i) === id)

  const describe = (id: UniqueIdentifier): string => {
    const key = String(id)
    const index = findIndexById(key)
    if (index < 0) {
      return "section"
    }
    const section = sections[index]
    return section.title?.trim() || section.type.charAt(0).toUpperCase() + section.type.slice(1)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const fromIndex = findIndexById(String(active.id))
      const targetIndex = findIndexById(String(over.id))
      if (fromIndex >= 0 && targetIndex >= 0) {
        reorderSection(fromIndex, targetIndex)
      }
    }
  }

  return (
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
              ? `${describe(active.id)} was moved over ${describe(over.id)}, position ${findIndexById(String(over.id)) + 1} of ${sections.length}`
              : undefined,
          onDragEnd: ({ active, over }) =>
            over ? `${describe(active.id)} was dropped over ${describe(over.id)}` : undefined,
          onDragCancel: ({ active }) => `Reorder of ${describe(active.id)} was cancelled.`,
        },
      }}
    >
      <SortableContext
        items={sections.map((section, i) => itemKey(section, i))}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col gap-4">
          {sections.map((section, index) => (
            <SectionRow
              key={itemKey(section, index)}
              section={section}
              index={index}
              updateSection={updateSection}
              removeSection={removeSection}
              clearErrors={clearErrors}
            />
          ))}

          {sections.length === 0 && (
            <p className="rounded-[10px] border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
              No sections yet. Add one below to start building your resume.
            </p>
          )}
        </div>
      </SortableContext>
    </DndContext>
  )
}
