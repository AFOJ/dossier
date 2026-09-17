import type { ExperienceCompany } from "@/db/types"
import type { UseFormClearErrors } from "react-hook-form"
import type { ResumeFormData } from "@/pages/resumes/create/hooks/useCreateResumeForm"
import { CompaniesEditor } from "@/pages/resumes/create/components/experience/CompaniesEditor"

type ExperienceSectionFieldsProps = {
  sectionIndex: number
  companies: ExperienceCompany[]
  onChange: (companies: ExperienceCompany[]) => void
  clearErrors: UseFormClearErrors<ResumeFormData>
}

export function ExperienceSectionFields(props: Readonly<ExperienceSectionFieldsProps>) {
  const { sectionIndex, companies, onChange, clearErrors } = props

  return (
    <CompaniesEditor
      sectionIndex={sectionIndex}
      companies={companies}
      onChange={onChange}
      clearErrors={clearErrors}
    />
  )
}
