import type { ExperienceCompanyRole } from "@/db/types"
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
import { RoleFields } from "@/pages/resumes/create/components/experience/RoleFields"
import { SortableRoleCard } from "@/pages/resumes/create/components/experience/SortableRoleCard"
import { BulletsEditor } from "@/pages/resumes/create/components/experience/BulletsEditor"
import { useFocusLastRow } from "@/hooks/useFocusLastRow"

type RolesEditorProps = {
  sectionIndex: number
  companyIndex: number
  roles: ExperienceCompanyRole[]
  onChange: (roles: ExperienceCompanyRole[]) => void
  clearErrors: UseFormClearErrors<ResumeFormData>
}

export function RolesEditor(props: Readonly<RolesEditorProps>) {
  const { sectionIndex, companyIndex, roles, onChange, clearErrors } = props

  const {
    formState: { errors },
  } = useResumeFieldContext()

  const sectionErrors = getSectionErrors(errors, sectionIndex) as
    ExperienceSectionErrors | undefined
  const companyErrors = sectionErrors?.companies?.[companyIndex]
  const rolesError = companyErrors?.roles?.message

  const containerRef = useFocusLastRow(roles.length)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const findIndexById = (id: string) => roles.findIndex((role, i) => itemKey(role, i) === id)

  const describe = (id: UniqueIdentifier): string => {
    const key = String(id)
    const index = findIndexById(key)
    if (index < 0) return "role"
    const role = roles[index]
    return role.job_title?.trim() || "Untitled Role"
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const fromIndex = findIndexById(String(active.id))
      const targetIndex = findIndexById(String(over.id))
      if (fromIndex >= 0 && targetIndex >= 0) {
        onChange(arrayMove(roles, fromIndex, targetIndex))
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
              ? `${describe(active.id)} was moved over ${describe(over.id)}, position ${findIndexById(String(over.id)) + 1} of ${roles.length}`
              : undefined,
          onDragEnd: ({ active, over }) =>
            over ? `${describe(active.id)} was dropped over ${describe(over.id)}` : undefined,
          onDragCancel: ({ active }) => `Reorder of ${describe(active.id)} was cancelled.`,
        },
      }}
    >
      <SortableContext
        items={roles.map((role, i) => itemKey(role, i))}
        strategy={verticalListSortingStrategy}
      >
        <div ref={containerRef} className="flex flex-col gap-3">
          {rolesError && (
            <p role="alert" className="text-sm text-red-700">
              {rolesError}
            </p>
          )}

          {roles.map((role, index) => {
            const roleErrors = companyErrors?.roles?.[index]
            const hasErrors = roleErrors !== undefined
            const label = role.job_title?.trim() || "Untitled Role"

            return (
              <SortableRoleCard
                key={itemKey(role, index)}
                id={itemKey(role, index)}
                label={label}
                hasErrors={hasErrors}
                onRemove={() => {
                  clearErrors(`sections.${sectionIndex}.companies.${companyIndex}.roles.${index}`)
                  onChange(roles.filter((_, i) => i !== index))
                }}
              >
                <div className="flex flex-col gap-3">
                  <RoleFields
                    sectionIndex={sectionIndex}
                    companyIndex={companyIndex}
                    roleIndex={index}
                    role={role}
                    roleErrors={roleErrors}
                    onChange={(next) =>
                      onChange(roles.map((current, i) => (i === index ? next : current)))
                    }
                  />
                  <BulletsEditor
                    sectionIndex={sectionIndex}
                    companyIndex={companyIndex}
                    roleIndex={index}
                    roleLabel={label}
                    bullets={role.bullets}
                    onChange={(bullets) =>
                      onChange(
                        roles.map((current, i) =>
                          i === index ? { ...current, bullets } : current,
                        ),
                      )
                    }
                    clearErrors={clearErrors}
                  />
                </div>
              </SortableRoleCard>
            )
          })}

          <AddItemButton
            label="Add role"
            onAdd={() => {
              const role = withKey({
                job_title: "",
                employment_type: undefined,
                location: undefined,
                start_date: undefined,
                end_date: "",
                bullets: [],
              })
              onChange([...roles, role])
            }}
          />
        </div>
      </SortableContext>
    </DndContext>
  )
}
