import { Field, Input } from "@/components/ui"
import { EndDateField } from "@/pages/resumes/create/components/experience/EndDateField"
import type { ExperienceCompany } from "@/db/types"

type CompanyFieldsProps = {
  company: ExperienceCompany
  sectionIndex: number
  companyIndex: number
  companyErrors:
    | {
        company_name?: { message?: string }
        company_website?: { message?: string }
        start_date?: { message?: string }
        end_date?: { message?: string }
      }
    | undefined
  onChange: (company: ExperienceCompany) => void
}

export function CompanyFields(props: Readonly<CompanyFieldsProps>) {
  const { company, sectionIndex, companyIndex, companyErrors, onChange } = props

  const update = (patch: Partial<ExperienceCompany>) => onChange({ ...company, ...patch })
  const isCurrentRole = company.end_date === undefined

  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          label="Company"
          inputId={`section-${sectionIndex}-company-${companyIndex}-name`}
          required
          error={companyErrors?.company_name?.message}
        >
          <Input
            id={`section-${sectionIndex}-company-${companyIndex}-name`}
            placeholder="Spotify"
            aria-invalid={companyErrors?.company_name ? true : undefined}
            value={company.company_name}
            onChange={(event) => update({ company_name: event.target.value })}
          />
        </Field>

        <Field
          label="Website"
          inputId={`section-${sectionIndex}-company-${companyIndex}-website`}
          error={companyErrors?.company_website?.message}
        >
          <Input
            id={`section-${sectionIndex}-company-${companyIndex}-website`}
            placeholder="https://example.com"
            value={company.company_website ?? ""}
            onChange={(event) =>
              update({
                company_website: event.target.value.trim() === "" ? undefined : event.target.value,
              })
            }
          />
        </Field>

        <Field
          label="Start date"
          inputId={`section-${sectionIndex}-company-${companyIndex}-start`}
          required
          error={companyErrors?.start_date?.message}
        >
          <Input
            id={`section-${sectionIndex}-company-${companyIndex}-start`}
            type="month"
            aria-invalid={companyErrors?.start_date ? true : undefined}
            value={company.start_date}
            onChange={(event) => update({ start_date: event.target.value })}
          />
        </Field>

        <EndDateField
          id={`section-${sectionIndex}-company-${companyIndex}-end`}
          value={company.end_date}
          error={companyErrors?.end_date?.message}
          isPresent={isCurrentRole}
          onValueChange={(end_date) => update({ end_date })}
          onPresentChange={(present) => update({ end_date: present ? undefined : "" })}
        />
      </div>
    </div>
  )
}
