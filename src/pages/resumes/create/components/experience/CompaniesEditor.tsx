import type { ExperienceCompany } from "@/db/types"
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
} from "@dnd-kit/sortable"
import {
  getSectionErrors,
  useResumeFieldContext,
  itemKey,
  withKey,
  type ExperienceSectionErrors,
  type ResumeFormData,
} from "@/pages/resumes/create/hooks/useCreateResumeForm"
import { CompanyFields } from "@/pages/resumes/create/components/experience/CompanyFields"
import { SortableCompanyCard } from "@/pages/resumes/create/components/experience/SortableCompanyCard"
import { RolesEditor } from "@/pages/resumes/create/components/experience/RolesEditor"

type CompaniesEditorProps = {
  sectionIndex: number
  companies: ExperienceCompany[]
  onChange: (companies: ExperienceCompany[]) => void
  clearErrors: UseFormClearErrors<ResumeFormData>
}

export function CompaniesEditor(props: Readonly<CompaniesEditorProps>) {
  const { sectionIndex, companies, onChange, clearErrors } = props

  const {
    formState: { errors },
  } = useResumeFieldContext()

  const sectionErrors = getSectionErrors(errors, sectionIndex) as
    ExperienceSectionErrors | undefined
  const sectionError = sectionErrors?.companies?.message

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const findIndexById = (id: string) =>
    companies.findIndex((company, i) => itemKey(company, i) === id)

  const describe = (id: UniqueIdentifier): string => {
    const key = String(id)
    const index = findIndexById(key)
    if (index < 0) return "company"
    const company = companies[index]
    return company.company_name?.trim() || "Untitled Company"
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const fromIndex = findIndexById(String(active.id))
      const targetIndex = findIndexById(String(over.id))
      if (fromIndex >= 0 && targetIndex >= 0) {
        onChange(arrayMove(companies, fromIndex, targetIndex))
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
              ? `${describe(active.id)} was moved over ${describe(over.id)}, position ${findIndexById(String(over.id)) + 1} of ${companies.length}`
              : undefined,
          onDragEnd: ({ active, over }) =>
            over ? `${describe(active.id)} was dropped over ${describe(over.id)}` : undefined,
          onDragCancel: ({ active }) => `Reorder of ${describe(active.id)} was cancelled.`,
        },
      }}
    >
      <SortableContext
        items={companies.map((company, i) => itemKey(company, i))}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col gap-3">
          {sectionError && (
            <p role="alert" className="text-sm text-red-700">
              {sectionError}
            </p>
          )}

          {companies.map((company, index) => {
            const companyErrors = sectionErrors?.companies?.[index]
            const hasErrors = companyErrors !== undefined
            const label = company.company_name?.trim() || "Untitled Company"

            return (
              <SortableCompanyCard
                key={itemKey(company, index)}
                id={itemKey(company, index)}
                label={label}
                hasErrors={hasErrors}
                onRemove={() => {
                  clearErrors(`sections.${sectionIndex}.companies.${index}`)
                  onChange(companies.filter((_, i) => i !== index))
                }}
              >
                <div className="flex flex-col gap-3">
                  <CompanyFields
                    sectionIndex={sectionIndex}
                    companyIndex={index}
                    company={company}
                    companyErrors={companyErrors}
                    onChange={(next) =>
                      onChange(companies.map((current, i) => (i === index ? next : current)))
                    }
                  />
                  <RolesEditor
                    sectionIndex={sectionIndex}
                    companyIndex={index}
                    roles={company.roles}
                    onChange={(roles) =>
                      onChange(
                        companies.map((current, i) =>
                          i === index ? { ...current, roles } : current,
                        ),
                      )
                    }
                    clearErrors={clearErrors}
                  />
                </div>
              </SortableCompanyCard>
            )
          })}

          <AddItemButton
            label="Add company"
            onAdd={() =>
              onChange([
                ...companies,
                withKey({
                  company_name: "",
                  start_date: "",
                  end_date: undefined,
                  roles: [],
                }),
              ])
            }
          />
        </div>
      </SortableContext>
    </DndContext>
  )
}
