import { memo } from 'react'
import { Textarea } from '@/components/ui'
import type { ResumeSectionData } from '@/db/schemas'
import { CompaniesEditor } from '@/pages/resumes/create/components/ExperienceSectionFields'
import { InstitutionsEditor } from '@/pages/resumes/create/components/EducationSectionFields'
import { GroupsEditor } from '@/pages/resumes/create/components/SkillsSectionFields'
import {
  getSectionErrors,
  useResumeFieldContext,
} from '@/pages/resumes/create/hooks/useCreateResumeForm'

type SectionFieldsProps = {
  section: ResumeSectionData
  label: string
  index: number
  onChange: (section: ResumeSectionData) => void
}

function SectionFieldsImpl(props: Readonly<SectionFieldsProps>) {
  const { section, label, index, onChange } = props
  const {
    formState: { errors },
  } = useResumeFieldContext()

  const sectionErrors = getSectionErrors(errors, index)

  switch (section.type) {
    case 'paragraph': {
      const textError = sectionErrors?.text?.message

      return (
        <div className="flex flex-col gap-1">
          <Textarea
            aria-label={`${label} text`}
            placeholder="A short paragraph..."
            value={section.text}
            rows={4}
            onChange={(event) =>
              onChange({ ...section, type: 'paragraph', text: event.target.value })
            }
          />
          {textError && (
            <p role="alert" className="text-sm text-red-700">
              {textError}
            </p>
          )}
        </div>
      )
    }
    case 'education':
      return (
        <InstitutionsEditor
          sectionIndex={index}
          institutions={section.institutions}
          onChange={(institutions) =>
            onChange({ ...section, type: 'education', institutions })
          }
        />
      )
    case 'skills':
      return (
        <GroupsEditor
          sectionIndex={index}
          groups={section.groups}
          onChange={(groups) => onChange({ ...section, type: 'skills', groups })}
        />
      )
    case 'experience':
      return (
        <CompaniesEditor
          sectionIndex={index}
          companies={section.companies}
          onChange={(companies) =>
            onChange({ ...section, type: 'experience', companies })
          }
        />
      )
  }
}

export const SectionFields = memo(SectionFieldsImpl)
