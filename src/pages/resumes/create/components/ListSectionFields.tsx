import type { ListItem } from '@/db/types'
import { Field, Input, Textarea } from '@/components/ui'
import {
  AddItemButton,
  ItemControls,
} from '@/pages/resumes/create/components/SectionCard'
import {
  getSectionErrors,
  useResumeFieldContext,
  itemKey,
  withKey,
} from '@/pages/resumes/create/hooks/useCreateResumeForm'

type ListItemRowProps = {
  sectionIndex: number
  item: ListItem
  index: number
  isFirst: boolean
  isLast: boolean
  onChange: (item: ListItem) => void
  onMove: (from: number, to: number) => void
  onRemove: () => void
}

export function ListItemRow(props: Readonly<ListItemRowProps>) {
  const {
    sectionIndex,
    item,
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
  const itemErrors = sectionErrors?.type === 'list' ? sectionErrors.items?.[index] : undefined

  const update = (patch: Partial<ListItem>) => onChange({ ...item, ...patch })

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-gray-200 p-3">
      <Field
        label="Title"
        inputId={`section-${sectionIndex}-item-title-${index}`}
        error={itemErrors?.title?.message}
      >
        <Input
          id={`section-${sectionIndex}-item-title-${index}`}
          placeholder="Project name"
          aria-invalid={itemErrors?.title ? true : undefined}
          value={item.title ?? ''}
          onChange={(event) => update({ title: event.target.value })}
        />
        {itemErrors?.title && (
          <p role="alert" className="mt-1 text-xs text-red-700">
            {itemErrors.title.message}
          </p>
        )}
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          label="URL"
          inputId={`section-${sectionIndex}-item-url-${index}`}
          error={itemErrors?.url?.message}
        >
          <Input
            id={`section-${sectionIndex}-item-url-${index}`}
            type="url"
            placeholder="https://example.com"
            aria-invalid={itemErrors?.url ? true : undefined}
            value={item.url ?? ''}
            onChange={(event) => update({ url: event.target.value })}
          />
          {itemErrors?.url && (
            <p role="alert" className="mt-1 text-xs text-red-700">
              {itemErrors.url.message}
            </p>
          )}
        </Field>

        <Field
          label="Date"
          inputId={`section-${sectionIndex}-item-date-${index}`}
          error={itemErrors?.date?.message}
        >
          <Input
            id={`section-${sectionIndex}-item-date-${index}`}
            placeholder="2024"
            value={item.date ?? ''}
            onChange={(event) => update({ date: event.target.value })}
          />
          {itemErrors?.date && (
            <p role="alert" className="mt-1 text-xs text-red-700">
              {itemErrors.date.message}
            </p>
          )}
        </Field>
      </div>

      <Field
        label="Description"
        inputId={`section-${sectionIndex}-item-description-${index}`}
        required
        error={itemErrors?.description?.message}
      >
        <Textarea
          id={`section-${sectionIndex}-item-description-${index}`}
          rows={3}
          placeholder="What was this project about?"
          aria-invalid={itemErrors?.description ? true : undefined}
          value={item.description}
          onChange={(event) => update({ description: event.target.value })}
        />
        {itemErrors?.description && (
          <p role="alert" className="mt-1 text-xs text-red-700">
            {itemErrors.description.message}
          </p>
        )}
      </Field>

      <div className="flex items-center justify-end pt-2">
        <ItemControls
          label={`item ${index + 1}`}
          index={index}
          isFirst={isFirst}
          isLast={isLast}
          onMove={onMove}
          onRemove={onRemove}
        />
      </div>
    </div>
  )
}

type ListItemsEditorProps = {
  sectionIndex: number
  items: ListItem[]
  onChange: (items: ListItem[]) => void
}

export function ListItemsEditor(props: Readonly<ListItemsEditorProps>) {
  const { sectionIndex, items, onChange } = props

  const {
    formState: { errors },
  } = useResumeFieldContext()

  const sectionErrors = getSectionErrors(errors, sectionIndex)
  const sectionError = sectionErrors?.type === 'list' ? sectionErrors.items?.message : undefined

  return (
    <div className="flex flex-col gap-3">
      {sectionError && (
        <p role="alert" className="text-sm text-red-700">
          {sectionError}
        </p>
      )}

      {items.map((item, index) => (
        <ListItemRow
          key={itemKey(item, index)}
          sectionIndex={sectionIndex}
          item={item}
          index={index}
          isFirst={index === 0}
          isLast={index === items.length - 1}
          onChange={(next) =>
            onChange(items.map((current, i) => (i === index ? next : current)))
          }
          onMove={(from, to) => {
            const next = [...items]
            ;[next[from], next[to]] = [next[to], next[from]]
            onChange(next)
          }}
          onRemove={() => onChange(items.filter((_, i) => i !== index))}
        />
      ))}

      <AddItemButton
        label="Add item"
        onAdd={() =>
          onChange([
            ...items,
            withKey({ title: '', url: '', description: '', date: '' }),
          ])
        }
      />
    </div>
  )
}