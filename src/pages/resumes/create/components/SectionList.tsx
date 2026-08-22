import { memo } from 'react'
import { SectionCard } from '@/pages/resumes/create/components/SectionCard'
import { SectionFields } from '@/pages/resumes/create/components/SectionFields'
import { useWatch, type Control } from 'react-hook-form'
import type { ResumeFormData } from '@/pages/resumes/create/hooks/useCreateResumeForm'
import type { ResumeSectionData } from '@/db/schemas'

type SectionRowProps = {
  section: ResumeSectionData
  index: number
  isFirst: boolean
  isLast: boolean
  updateSection: (index: number, section: ResumeSectionData) => void
  moveSection: (index: number, direction: -1 | 1) => void
  removeSection: (index: number) => void
}

function SectionRowImpl(props: Readonly<SectionRowProps>) {
  const {
    section,
    index,
    isFirst,
    isLast,
    updateSection,
    moveSection,
    removeSection,
  } = props

  const label =
    section.title?.trim() ||
    section.type.charAt(0).toUpperCase() + section.type.slice(1)

  return (
    <SectionCard
      label={label}
      title={section.title ?? ''}
      onTitleChange={(title) => updateSection(index, { ...section, title })}
      isFirst={isFirst}
      isLast={isLast}
      onMoveUp={() => moveSection(index, -1)}
      onMoveDown={() => moveSection(index, 1)}
      onRemove={() => removeSection(index)}
    >
      <SectionFields
        section={section}
        label={label}
        onChange={(next) => updateSection(index, next)}
      />
    </SectionCard>
  )
}

const SectionRow = memo(SectionRowImpl)

type SectionListProps = {
  control: Control<ResumeFormData>
  updateSection: (index: number, section: ResumeSectionData) => void
  moveSection: (index: number, direction: -1 | 1) => void
  removeSection: (index: number) => void
}

export function SectionList(props: Readonly<SectionListProps>) {
  const { control, updateSection, moveSection, removeSection } = props

  const sections = useWatch({ control, name: 'sections' })

  return (
    <div className="flex flex-col gap-4">
      {sections.map((section, index) => (
        <SectionRow
          key={`${section.type}-${index}`}
          section={section}
          index={index}
          isFirst={index === 0}
          isLast={index === sections.length - 1}
          updateSection={updateSection}
          moveSection={moveSection}
          removeSection={removeSection}
        />
      ))}

      {sections.length === 0 && (
        <p className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
          No sections yet. Add one below to start building your resume.
        </p>
      )}
    </div>
  )
}
