import { CompaniesEditor } from '@/pages/resumes/create/components/ExperienceSectionFields'
import { GroupsEditor } from '@/pages/resumes/create/components/SkillsSectionFields'
import { InstitutionsEditor } from '@/pages/resumes/create/components/EducationSectionFields'
import { memo } from 'react'
import { Textarea } from '@/components/ui'
import type { ResumeSectionData } from '@/db/schemas'

type SectionFieldsProps = {
  section: ResumeSectionData
  label: string
  onChange: (section: ResumeSectionData) => void
}

function SectionFieldsImpl(props: Readonly<SectionFieldsProps>) {
  const { section, label, onChange } = props

  switch (section.type) {
    case 'summary':
      return (
        <Textarea
          aria-label={`${label} text`}
          placeholder="A short paragraph..."
          value={section.text}
          rows={4}
          onChange={(event) =>
            onChange({ ...section, type: 'summary', text: event.target.value })
          }
        />
      )
    case 'education':
      return (
        <InstitutionsEditor
          institutions={section.institutions}
          onChange={(institutions) =>
            onChange({ ...section, type: 'education', institutions })
          }
        />
      )
    case 'skills':
      return (
        <GroupsEditor
          groups={section.groups}
          onChange={(groups) =>
            onChange({ ...section, type: 'skills', groups })
          }
        />
      )
    case 'experience':
      return (
        <CompaniesEditor
          companies={section.companies}
          onChange={(companies) =>
            onChange({ ...section, type: 'experience', companies })
          }
        />
      )
  }
}

export const SectionFields = memo(SectionFieldsImpl)
