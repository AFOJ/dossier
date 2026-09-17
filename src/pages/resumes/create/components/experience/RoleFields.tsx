import { Field, Input } from "@/components/ui"
import { EndDateField } from "@/pages/resumes/create/components/experience/EndDateField"
import type { ExperienceCompanyRole } from "@/db/types"

type RoleFieldsProps = {
  role: ExperienceCompanyRole
  sectionIndex: number
  companyIndex: number
  roleIndex: number
  roleErrors:
    | {
        job_title?: { message?: string }
        start_date?: { message?: string }
        end_date?: { message?: string }
      }
    | undefined
  onChange: (role: ExperienceCompanyRole) => void
}

export function RoleFields(props: Readonly<RoleFieldsProps>) {
  const { role, sectionIndex, companyIndex, roleIndex, roleErrors, onChange } = props

  const update = (patch: Partial<ExperienceCompanyRole>) => onChange({ ...role, ...patch })

  return (
    <div className="flex flex-col gap-3">
      <Field
        label="Job title"
        inputId={`section-${sectionIndex}-company-${companyIndex}-role-${roleIndex}-title`}
        required
        error={roleErrors?.job_title?.message}
      >
        <Input
          id={`section-${sectionIndex}-company-${companyIndex}-role-${roleIndex}-title`}
          placeholder="Data Analyst"
          aria-invalid={roleErrors?.job_title ? true : undefined}
          value={role.job_title}
          onChange={(event) => update({ job_title: event.target.value })}
        />
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          label="Employment type"
          inputId={`section-${sectionIndex}-company-${companyIndex}-role-${roleIndex}-type`}
        >
          <Input
            id={`section-${sectionIndex}-company-${companyIndex}-role-${roleIndex}-type`}
            placeholder="Full-time"
            value={role.employment_type ?? ""}
            onChange={(event) =>
              update({
                employment_type: event.target.value.trim() === "" ? undefined : event.target.value,
              })
            }
          />
        </Field>

        <Field
          label="Location"
          inputId={`section-${sectionIndex}-company-${companyIndex}-role-${roleIndex}-location`}
        >
          <Input
            id={`section-${sectionIndex}-company-${companyIndex}-role-${roleIndex}-location`}
            placeholder="London, UK"
            value={role.location ?? ""}
            onChange={(event) =>
              update({
                location: event.target.value.trim() === "" ? undefined : event.target.value,
              })
            }
          />
        </Field>

        <Field
          label="Start date"
          inputId={`section-${sectionIndex}-company-${companyIndex}-role-${roleIndex}-start`}
          error={roleErrors?.start_date?.message}
        >
          <Input
            id={`section-${sectionIndex}-company-${companyIndex}-role-${roleIndex}-start`}
            type="month"
            aria-invalid={roleErrors?.start_date ? true : undefined}
            value={role.start_date ?? ""}
            onChange={(event) =>
              update({
                start_date: event.target.value.trim() === "" ? undefined : event.target.value,
              })
            }
          />
        </Field>

        <EndDateField
          id={`section-${sectionIndex}-company-${companyIndex}-role-${roleIndex}-end`}
          value={role.end_date}
          error={roleErrors?.end_date?.message}
          isPresent={role.end_date === undefined}
          onValueChange={(end_date) => update({ end_date })}
          onPresentChange={(present) => update({ end_date: present ? undefined : "" })}
        />
      </div>
    </div>
  )
}
