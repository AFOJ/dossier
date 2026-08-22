import type { EducationalInstitution } from '@/db/types'
import { Field, Input, Textarea } from '@/components/ui'
import {
  AddItemButton,
  ItemControls,
} from '@/pages/resumes/create/components/SectionCard'

type InstitutionRowProps = {
  institution: EducationalInstitution
  index: number
  isFirst: boolean
  isLast: boolean
  onChange: (institution: EducationalInstitution) => void
  onMove: (from: number, to: number) => void
  onRemove: () => void
}

export function InstitutionRow(props: Readonly<InstitutionRowProps>) {
  const { institution, index, isFirst, isLast, onChange, onMove, onRemove } =
    props

  const update = (patch: Partial<EducationalInstitution>) =>
    onChange({ ...institution, ...patch })

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-gray-200 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="grid flex-1 gap-3 sm:grid-cols-2">
          <Field label="School" inputId={`school-${index}`} required>
            <Input
              id={`school-${index}`}
              placeholder="University of London"
              value={institution.name}
              onChange={(event) => update({ name: event.target.value })}
            />
          </Field>

          <Field label="Degree" inputId={`degree-${index}`} required>
            <Input
              id={`degree-${index}`}
              placeholder="BSc Computer Science"
              value={institution.degree}
              onChange={(event) => update({ degree: event.target.value })}
            />
          </Field>

          <Field label="Grade" inputId={`grade-${index}`}>
            <Input
              id={`grade-${index}`}
              placeholder="First Class Honours"
              value={institution.grade ?? ''}
              onChange={(event) =>
                update({
                  grade:
                    event.target.value.trim() === ''
                      ? undefined
                      : event.target.value,
                })
              }
            />
          </Field>

          <Field label="Location" inputId={`education-location-${index}`}>
            <Input
              id={`education-location-${index}`}
              placeholder="London, UK"
              value={institution.location}
              onChange={(event) => update({ location: event.target.value })}
            />
          </Field>

          <Field label="Start date" inputId={`education-start-${index}`}>
            <Input
              id={`education-start-${index}`}
              placeholder="2015"
              value={institution.start_date}
              onChange={(event) => update({ start_date: event.target.value })}
            />
          </Field>

          <Field label="End date" inputId={`education-end-${index}`}>
            <Input
              id={`education-end-${index}`}
              placeholder="2019"
              value={institution.end_date}
              onChange={(event) => update({ end_date: event.target.value })}
            />
          </Field>
        </div>

        <ItemControls
          label={`school ${index + 1}`}
          index={index}
          isFirst={isFirst}
          isLast={isLast}
          onMove={onMove}
          onRemove={onRemove}
        />
      </div>

      <Field
        label="Paragraph"
        inputId={`education-paragraph-${index}`}
        description="Anything else worth highlighting about this education."
      >
        <Textarea
          id={`education-paragraph-${index}`}
          rows={3}
          value={institution.paragraph ?? ''}
          onChange={(event) =>
            update({
              paragraph:
                event.target.value.trim() === ''
                  ? undefined
                  : event.target.value,
            })
          }
        />
      </Field>
    </div>
  )
}

type InstitutionsEditorProps = {
  institutions: EducationalInstitution[]
  onChange: (institutions: EducationalInstitution[]) => void
}

export function InstitutionsEditor(props: Readonly<InstitutionsEditorProps>) {
  const { institutions, onChange } = props

  return (
    <div className="flex flex-col gap-3">
      {institutions.map((institution, index) => (
        <InstitutionRow
          key={index}
          institution={institution}
          index={index}
          isFirst={index === 0}
          isLast={index === institutions.length - 1}
          onChange={(next) =>
            onChange(
              institutions.map((current, i) => (i === index ? next : current)),
            )
          }
          onMove={(from, to) => {
            const next = [...institutions]
            ;[next[from], next[to]] = [next[to], next[from]]
            onChange(next)
          }}
          onRemove={() => onChange(institutions.filter((_, i) => i !== index))}
        />
      ))}

      <AddItemButton
        label="Add school"
        onAdd={() =>
          onChange([
            ...institutions,
            {
              name: '',
              degree: '',
              start_date: '',
              end_date: '',
              location: '',
            },
          ])
        }
      />
    </div>
  )
}
