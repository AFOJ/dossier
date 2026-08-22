import type { SkillGroup } from '@/db/types'
import { Field, Input, TagInput } from '@/components/ui'

import {
  AddItemButton,
  ItemControls,
} from '@/pages/resumes/create/components/SectionCard'

type GroupRowProps = {
  group: SkillGroup
  index: number
  isFirst: boolean
  isLast: boolean
  onChange: (group: SkillGroup) => void
  onMove: (from: number, to: number) => void
  onRemove: () => void
}

export function GroupRow(props: Readonly<GroupRowProps>) {
  const { group, index, isFirst, isLast, onChange, onMove, onRemove } = props

  return (
    <div className="flex items-start gap-2 rounded-lg border border-gray-200 p-3">
      <div className="grid flex-1 gap-3 sm:grid-cols-2">
        <Field label="Group title" inputId={`group-title-${index}`}>
          <Input
            id={`group-title-${index}`}
            placeholder="Frontend"
            value={group.title}
            onChange={(event) =>
              onChange({ ...group, title: event.target.value })
            }
          />
        </Field>

        <Field label="Skills" inputId={`group-items-${index}`}>
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
  groups: SkillGroup[]
  onChange: (groups: SkillGroup[]) => void
}

export function GroupsEditor(props: Readonly<GroupsEditorProps>) {
  const { groups, onChange } = props

  return (
    <div className="flex flex-col gap-3">
      {groups.map((group, index) => (
        <GroupRow
          key={index}
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
