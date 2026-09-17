import { memo, useId } from "react"
import { Textarea } from "@/components/ui"
import { Field } from "@/components/ui"
import type { ResumeSectionData } from "@/db/schemas"
import { CompaniesEditor } from "@/pages/resumes/create/components/ExperienceSectionFields"
import { InstitutionsEditor } from "@/pages/resumes/create/components/EducationSectionFields"
import { GroupsEditor } from "@/pages/resumes/create/components/SkillsSectionFields"
import { ListItemsEditor } from "@/pages/resumes/create/components/ListSectionFields"
import {
  getSectionErrors,
  useResumeFieldContext,
  type ParagraphSectionErrors,
  type ResumeFormData,
} from "@/pages/resumes/create/hooks/useCreateResumeForm"
import type { UseFormClearErrors } from "react-hook-form"

type SectionFieldsProps = {
  section: ResumeSectionData
  label: string
  index: number
  onChange: (section: ResumeSectionData) => void
  clearErrors: UseFormClearErrors<ResumeFormData>
}

function SectionFieldsImpl(props: Readonly<SectionFieldsProps>) {
  const { section, label, index, onChange, clearErrors } = props
  const {
    formState: { errors },
  } = useResumeFieldContext()

  const sectionErrors = getSectionErrors(errors, index)

  const textInputId = useId()

  switch (section.type) {
    case "paragraph": {
      const textError = (sectionErrors as ParagraphSectionErrors | undefined)?.text?.message

      return (
        <Field label="Paragraph" inputId={textInputId} error={textError}>
          <Textarea
            id={textInputId}
            aria-label={`${label} text`}
            placeholder="A short paragraph..."
            value={section.text}
            rows={4}
            onChange={(event) =>
              onChange({ ...section, type: "paragraph", text: event.target.value })
            }
          />
        </Field>
      )
    }
    case "education":
      return (
        <InstitutionsEditor
          sectionIndex={index}
          institutions={section.institutions}
          onChange={(institutions) => onChange({ ...section, type: "education", institutions })}
        />
      )
    case "skills":
      return (
        <GroupsEditor
          sectionIndex={index}
          groups={section.groups}
          onChange={(groups) => onChange({ ...section, type: "skills", groups })}
          clearErrors={clearErrors}
        />
      )
    case "experience":
      return (
        <CompaniesEditor
          sectionIndex={index}
          companies={section.companies}
          onChange={(companies) => onChange({ ...section, type: "experience", companies })}
        />
      )
    case "list":
      return (
        <ListItemsEditor
          sectionIndex={index}
          items={section.items}
          onChange={(items) => onChange({ ...section, type: "list", items })}
          clearErrors={clearErrors}
        />
      )
  }
}

export const SectionFields = memo(SectionFieldsImpl)
