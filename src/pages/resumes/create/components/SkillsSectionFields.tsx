import type { SkillGroup } from '@/db/types'
import { Field, Input, TagInput } from '@/components/ui'

import {
  AddItemButton,
  ItemControls,
} from '@/pages/resumes/create/components/SectionCard'
import {
  getSectionErrors,
  useResumeFieldContext,
} from '@/pages/resumes/create/hooks/useCreateResumeForm'

type GroupRowProps = {
  sectionIndex: number
  group: SkillGroup
  index: number
  isFirst: boolean
  isLast: boolean
  onChange: (group: SkillGroup) => void
  onMove: (from: number, to: number) => void
  onRemove: () => void
}

export function GroupRow(props: Readonly<GroupRowProps>) {
  const {
    sectionIndex,
    group,
    index,
    isFirst,
    isLast,
    onChange,
    onMove,
    onRemove,
  } = props

  const {
    formState: { errors },
  } = useResumeFieldContext()

  const sectionErrors = getSectionErrors(errors, sectionIndex)

  const groupErrors = sectionErrors?.groups?.[index]

  return (
    <div className="flex flex-col-reverse gap-2 rounded-lg border border-gray-200 p-3 sm:flex-row sm:items-start">
      <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-2">
        <Field
          label="Group title"
          inputId={`group-title-${index}`}
          required
          error={groupErrors?.title?.message}
        >
          <Input
            id={`group-title-${index}`}
            placeholder="Soft Skills"
            aria-invalid={groupErrors?.title ? true : undefined}
            value={group.title}
            onChange={(event) =>
              onChange({ ...group, title: event.target.value })
            }
          />
        </Field>

        <Field
          label="Skills"
          inputId={`group-items-${index}`}
          required
          error={groupErrors?.items?.message}
        >
          <TagInput
            ariaLabel={`Skills for group ${index + 1}`}
            value={group.items}
            onChange={(items) => onChange({ ...group, items })}
          />
        </Field>
      </div>

      <ItemControls
        label={`group ${index + 1}`}
        index={index}
        isFirst={isFirst}
        isLast={isLast}
        onMove={onMove}
        onRemove={onRemove}
      />
    </div>
  )
}

type GroupsEditorProps = {
  sectionIndex: number
  groups: SkillGroup[]
  onChange: (groups: SkillGroup[]) => void
}

export function GroupsEditor(props: Readonly<GroupsEditorProps>) {
  const { sectionIndex, groups, onChange } = props

  const {
    formState: { errors },
  } = useResumeFieldContext()

  const sectionErrors = getSectionErrors(errors, sectionIndex)

  const sectionError = sectionErrors?.groups?.message

  return (
    <div className="flex flex-col gap-3">
      {sectionError && (
        <p role="alert" className="text-sm text-red-700">
          {sectionError}
        </p>
      )}

      {groups.map((group, index) => (
        <GroupRow
          key={index}
          sectionIndex={sectionIndex}
          group={group}
          index={index}
          isFirst={index === 0}
          isLast={index === groups.length - 1}
          onChange={(next) =>
            onChange(groups.map((current, i) => (i === index ? next : current)))
          }
          onMove={(from, to) => {
            const next = [...groups]
            ;[next[from], next[to]] = [next[to], next[from]]
            onChange(next)
          }}
          onRemove={() => onChange(groups.filter((_, i) => i !== index))}
        />
      ))}

      <AddItemButton
        label="Add skill group"
        onAdd={() => onChange([...groups, { title: '', items: [] }])}
      />
    </div>
  )
}
