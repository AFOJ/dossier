import type { ExperienceCompanyRoleBullet } from "@/db/types"
import { BulletAddMenu } from "@/pages/resumes/create/components/BulletAddMenu"
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
import { BulletFields } from "@/pages/resumes/create/components/experience/BulletFields"
import { SortableBulletCard } from "@/pages/resumes/create/components/experience/SortableBulletCard"
import { useFocusLastRow } from "@/hooks/useFocusLastRow"

type BulletsEditorProps = {
  sectionIndex: number
  companyIndex: number
  roleIndex: number
  roleLabel: string
  bullets: ExperienceCompanyRoleBullet[]
  onChange: (bullets: ExperienceCompanyRoleBullet[]) => void
  clearErrors: UseFormClearErrors<ResumeFormData>
}

export function BulletsEditor(props: Readonly<BulletsEditorProps>) {
  const { sectionIndex, companyIndex, roleIndex, roleLabel, bullets, onChange, clearErrors } = props

  const {
    formState: { errors },
  } = useResumeFieldContext()

  const sectionErrors = getSectionErrors(errors, sectionIndex) as
    ExperienceSectionErrors | undefined
  const companyErrors = sectionErrors?.companies?.[companyIndex]
  const roleErrors = companyErrors?.roles?.[roleIndex]

  const containerRef = useFocusLastRow(bullets.length)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const findIndexById = (id: string) => bullets.findIndex((bullet, i) => itemKey(bullet, i) === id)

  const describe = (id: UniqueIdentifier): string => {
    const key = String(id)
    const index = findIndexById(key)
    if (index < 0) return "bullet"
    const bullet = bullets[index]
    if (bullet.type === "text") {
      return bullet.text?.slice(0, 40) || "Empty Bullet"
    }
    return bullet.title?.trim() || "Empty Bullet"
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const fromIndex = findIndexById(String(active.id))
      const targetIndex = findIndexById(String(over.id))
      if (fromIndex >= 0 && targetIndex >= 0) {
        onChange(arrayMove(bullets, fromIndex, targetIndex))
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
              ? `${describe(active.id)} was moved over ${describe(over.id)}, position ${findIndexById(String(over.id)) + 1} of ${bullets.length}`
              : undefined,
          onDragEnd: ({ active, over }) =>
            over ? `${describe(active.id)} was dropped over ${describe(over.id)}` : undefined,
          onDragCancel: ({ active }) => `Reorder of ${describe(active.id)} was cancelled.`,
        },
      }}
    >
      <SortableContext
        items={bullets.map((bullet, i) => itemKey(bullet, i))}
        strategy={verticalListSortingStrategy}
      >
        <div ref={containerRef} className="flex flex-col gap-3">
          {bullets.map((bullet, index) => {
            const bulletErrors = roleErrors?.bullets?.[index]
            const hasErrors = bulletErrors !== undefined
            const label =
              bullet.type === "text"
                ? bullet.text?.slice(0, 50) || "Empty Bullet"
                : bullet.title?.trim() || "Empty Bullet"

            return (
              <SortableBulletCard
                key={itemKey(bullet, index)}
                id={itemKey(bullet, index)}
                label={label}
                hasErrors={hasErrors}
                onRemove={() => {
                  clearErrors(
                    `sections.${sectionIndex}.companies.${companyIndex}.roles.${roleIndex}.bullets.${index}`,
                  )
                  onChange(bullets.filter((_, i) => i !== index))
                }}
              >
                <BulletFields
                  bullet={bullet}
                  index={index}
                  roleLabel={roleLabel}
                  bulletErrors={bulletErrors}
                  onChange={(next) =>
                    onChange(bullets.map((current, i) => (i === index ? next : current)))
                  }
                />
              </SortableBulletCard>
            )
          })}

          <BulletAddMenu
            onAdd={(bullet) => {
              const keyed = withKey(bullet)
              onChange([...bullets, keyed])
            }}
          />
        </div>
      </SortableContext>
    </DndContext>
  )
}
