import type { EducationalInstitution } from '@/db/types'
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

type InstitutionItem = EducationalInstitution

type InstitutionRowProps = {
  sectionIndex: number
  institution: InstitutionItem
  index: number
  isFirst: boolean
  isLast: boolean
  onChange: (institution: InstitutionItem) => void
  onMove: (from: number, to: number) => void
  onRemove: () => void
}

export function InstitutionRow(props: Readonly<InstitutionRowProps>) {
  const {
    sectionIndex,
    institution,
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
  const institutionErrors =
    sectionErrors?.type === 'education' ? sectionErrors.institutions?.[index] : undefined

  const update = (patch: Partial<EducationalInstitution>) =>
    onChange({ ...institution, ...patch })

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-gray-200 p-3">
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-start sm:gap-2">
        <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-2">
          <Field
            label="School"
            inputId={`section-${sectionIndex}-school-${index}`}
            required
            error={institutionErrors?.name?.message}
          >
            <Input
              id={`section-${sectionIndex}-school-${index}`}
              placeholder="University of London"
              aria-invalid={institutionErrors?.name ? true : undefined}
              value={institution.name}
              onChange={(event) => update({ name: event.target.value })}
            />
          </Field>

          <Field
            label="Degree"
            inputId={`section-${sectionIndex}-degree-${index}`}
            required
            error={institutionErrors?.degree?.message}
          >
            <Input
              id={`section-${sectionIndex}-degree-${index}`}
              placeholder="BSc Computer Science"
              aria-invalid={institutionErrors?.degree ? true : undefined}
              value={institution.degree}
              onChange={(event) => update({ degree: event.target.value })}
            />
          </Field>

          <Field
            label="Grade"
            inputId={`section-${sectionIndex}-grade-${index}`}
          >
            <Input
              id={`section-${sectionIndex}-grade-${index}`}
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

          <Field
            label="Location"
            inputId={`section-${sectionIndex}-education-location-${index}`}
          >
            <Input
              id={`section-${sectionIndex}-education-location-${index}`}
              placeholder="London, UK"
              value={institution.location}
              onChange={(event) => update({ location: event.target.value })}
            />
          </Field>

          <Field
            label="Start date"
            inputId={`section-${sectionIndex}-education-start-${index}`}
          >
            <Input
              id={`section-${sectionIndex}-education-start-${index}`}
              placeholder="2015"
              value={institution.start_date}
              onChange={(event) => update({ start_date: event.target.value })}
            />
          </Field>

          <Field
            label="End date"
            inputId={`section-${sectionIndex}-education-end-${index}`}
          >
            <Input
              id={`section-${sectionIndex}-education-end-${index}`}
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
          className="self-start pt-7.5 max-sm:pt-0"
        />
      </div>

      <Field
        label="Paragraph"
        inputId={`section-${sectionIndex}-education-paragraph-${index}`}
        description="Anything else worth highlighting about this."
      >
        <Textarea
          id={`section-${sectionIndex}-education-paragraph-${index}`}
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
  sectionIndex: number
  institutions: InstitutionItem[]
  onChange: (institutions: InstitutionItem[]) => void
}

export function InstitutionsEditor(props: Readonly<InstitutionsEditorProps>) {
  const { sectionIndex, institutions, onChange } = props

  const {
    formState: { errors },
  } = useResumeFieldContext()

  const sectionErrors = getSectionErrors(errors, sectionIndex)
  const sectionError = sectionErrors?.type === 'education' ? sectionErrors.institutions?.message : undefined

  return (
    <div className="flex flex-col gap-3">
      {sectionError && (
        <p role="alert" className="text-sm text-red-700">
          {sectionError}
        </p>
      )}

      {institutions.map((institution, index) => (
        <InstitutionRow
          key={itemKey(institution, index)}
          sectionIndex={sectionIndex}
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
            withKey({
              name: '',
              degree: '',
              start_date: '',
              end_date: '',
              location: '',
            }),
          ])
        }
      />
    </div>
  )
}
