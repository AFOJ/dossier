import { Field, Input, TagInput } from "@/components/ui"
import type { ResumeProject } from "@/db/types"
import { useId } from "react"
import {
  getSectionErrors,
  useResumeFieldContext,
  type ProjectsSectionErrors,
} from "../hooks/useCreateResumeForm"
import { SyncSwitch } from "./SyncSwitch"
import { BulletsEditor } from "./experience/BulletsEditor"

type Props = {
  project: ResumeProject
  index: number
  sectionIndex: number
  onChange: (project: ResumeProject) => void
}
export function ProjectFields({ project, index, sectionIndex, onChange }: Readonly<Props>) {
  const id = useId()
  const {
    formState: { errors },
    clearErrors,
  } = useResumeFieldContext()
  const projectErrors = (
    getSectionErrors(errors, sectionIndex) as ProjectsSectionErrors | undefined
  )?.projects?.[index]
  const isCurrent = project.end_date === "Present" || project.end_date === "In progress"
  const update = (patch: Partial<ResumeProject>) => onChange({ ...project, ...patch })
  const fields = [
    ["name", "Project name"],
    ["url", "Project URL"],
    ["start_date", "Start date"],
    ["end_date", "End date"],
  ] as const
  return (
    <>
      {fields
        .filter(([field]) => field !== "end_date" || !isCurrent)
        .map(([field, label]) => (
          <Field
            key={field}
            label={label}
            inputId={`${id}-${field}`}
            required={field === "name"}
            error={projectErrors?.[field]?.message}
          >
            <Input
              id={`${id}-${field}`}
              value={project[field] ?? ""}
              aria-invalid={projectErrors?.[field] ? true : undefined}
              placeholder={
                field.endsWith("date")
                  ? "2024, 03-2024, or Summer 2024"
                  : field === "url"
                    ? "https://github.com/..."
                    : "My project"
              }
              onChange={(event) => update({ [field]: event.target.value })}
              onBlur={() => update({ [field]: project[field]?.trim() })}
            />
          </Field>
        ))}
      <p className="text-xs text-gray-500">
        Dates can be a year, month and year, or text such as Summer 2024.
      </p>
      <div className="flex items-center gap-2 text-sm text-gray-900">
        <SyncSwitch
          label="I'm currently working on this"
          checked={isCurrent}
          onCheckedChange={(checked) => update({ end_date: checked ? "Present" : "" })}
        />
        <span>I'm currently working on this</span>
      </div>
      <Field
        label="Technologies"
        inputId={`${id}-technologies`}
        error={projectErrors?.technologies?.message}
      >
        <TagInput
          reorderable
          ariaLabel={`Technologies for project ${index + 1}`}
          placeholder="Type a technology and press Enter"
          value={project.technologies}
          onChange={(technologies) => update({ technologies })}
        />
      </Field>
      {project.technologies.map(
        (technology, techIndex) =>
          projectErrors?.technologies?.[techIndex]?.message && (
            <p key={`${technology}-${techIndex}`} role="alert" className="text-sm text-red-700">
              {technology}: {projectErrors.technologies[techIndex].message}
            </p>
          ),
      )}
      <BulletsEditor
        sectionIndex={sectionIndex}
        projectIndex={index}
        roleLabel={project.name || "Project"}
        bullets={project.bullets}
        onChange={(bullets) => update({ bullets })}
        clearErrors={clearErrors}
      />
    </>
  )
}
