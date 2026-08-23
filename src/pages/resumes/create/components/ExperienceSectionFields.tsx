import type {
  ExperienceCompanyRoleBullet,
  ExperienceCompany,
  ExperienceCompanyRole,
} from '@/db/types'
import { Field, Input, Textarea } from '@/components/ui'
import { BulletAddMenu } from '@/pages/resumes/create/components/BulletAddMenu'
import { SyncSwitch } from '@/pages/resumes/create/components/SyncSwitch'
import {
  AddItemButton,
  ItemControls,
  type ItemControlsProps,
} from '@/pages/resumes/create/components/SectionCard'
import {
  getSectionErrors,
  useResumeFieldContext,
  itemKey,
  withKey,
} from '@/pages/resumes/create/hooks/useCreateResumeForm'

type BulletItem = ExperienceCompanyRoleBullet

type BulletsEditorProps = {
  sectionIndex: number
  companyIndex: number
  roleIndex: number
  roleLabel: string
  bullets: BulletItem[]
  onChange: (bullets: BulletItem[]) => void
}

export function BulletsEditor(props: Readonly<BulletsEditorProps>) {
  const {
    sectionIndex,
    companyIndex,
    roleIndex,
    roleLabel,
    bullets,
    onChange,
  } = props

  const {
    formState: { errors },
  } = useResumeFieldContext()

  const sectionErrors = getSectionErrors(errors, sectionIndex)

  const bulletErrors =
    sectionErrors?.companies?.[companyIndex]?.roles?.[roleIndex]?.bullets

  const move = (from: number, to: number) => {
    const next = [...bullets]
    ;[next[from], next[to]] = [next[to], next[from]]
    onChange(next)
  }

  const renderError = (index: number, field: 'title' | 'text') => {
    const message = bulletErrors?.[index]?.[field]?.message
    if (!message) {
      return null
    }
    return (
      <p role="alert" className="mt-1 text-xs text-red-700">
        {message}
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium text-gray-700">Bullets</p>

      {bullets.map((bullet, index) => {
        const controls: Omit<ItemControlsProps, 'label'> = {
          index,
          isFirst: index === 0,
          isLast: index === bullets.length - 1,
          onMove: move,
          onRemove: () => onChange(bullets.filter((_, i) => i !== index)),
        }

        return bullet.type === 'text' ? (
          <div
            key={itemKey(bullet, index)}
            className="flex flex-col-reverse items-start gap-2 rounded-lg border border-gray-200 p-3 sm:flex-row"
          >
            <div className="min-w-0 flex-1">
              <Input
                aria-label={`${roleLabel} bullet ${index + 1}`}
                aria-invalid={bulletErrors?.[index]?.text ? true : undefined}
                placeholder="What did you achieve?"
                value={bullet.text}
                className={
                  bulletErrors?.[index]?.text
                    ? 'w-full border-red-400 focus:border-red-600 focus:ring-red-600'
                    : 'w-full'
                }
                onChange={(event) =>
                  onChange(
                    bullets.map((current, i) =>
                      i === index
                        ? {
                            ...bullet,
                            type: 'text' as const,
                            text: event.target.value,
                          }
                        : current,
                    ),
                  )
                }
              />
              {renderError(index, 'text')}
            </div>
            <ItemControls {...controls} label={`bullet ${index + 1}`} />
          </div>
        ) : (
          <div
            key={itemKey(bullet, index)}
            className="flex flex-col-reverse items-start gap-2 rounded-lg border border-gray-200 p-3 sm:flex-row"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-col gap-2">
                <div>
                  <Input
                    aria-label={`${roleLabel} bullet ${index + 1} heading`}
                    aria-invalid={
                      bulletErrors?.[index]?.title ? true : undefined
                    }
                    placeholder="Heading"
                    value={bullet.title}
                    className={
                      bulletErrors?.[index]?.title
                        ? 'w-full border-red-400 focus:border-red-600 focus:ring-red-600'
                        : 'w-full'
                    }
                    onChange={(event) =>
                      onChange(
                        bullets.map((current, i) =>
                          i === index
                            ? { ...bullet, title: event.target.value }
                            : current,
                        ),
                      )
                    }
                  />
                  {renderError(index, 'title')}
                </div>
                <div>
                  <Textarea
                    aria-label={`${roleLabel} bullet ${index + 1} text`}
                    aria-invalid={
                      bulletErrors?.[index]?.text ? true : undefined
                    }
                    placeholder="What did you achieve?"
                    rows={3}
                    value={bullet.text}
                    className={
                      bulletErrors?.[index]?.text
                        ? 'w-full border-red-400 focus:border-red-600 focus:ring-red-600'
                        : 'w-full'
                    }
                    onChange={(event) =>
                      onChange(
                        bullets.map((current, i) =>
                          i === index
                            ? { ...bullet, text: event.target.value }
                            : current,
                        ),
                      )
                    }
                  />
                  {renderError(index, 'text')}
                </div>
              </div>
            </div>
            <ItemControls {...controls} label={`bullet ${index + 1}`} />
          </div>
        )
      })}

      <BulletAddMenu
        onAdd={(bullet) => onChange([...bullets, withKey(bullet)])}
      />
    </div>
  )
}

type EndDateFieldProps = {
  id: string
  value?: string
  error?: string
  isPresent: boolean
  onValueChange: (value: string | undefined) => void
  onPresentChange: (present: boolean) => void
}

function EndDateField(props: Readonly<EndDateFieldProps>) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium text-gray-900">End date</p>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <Input
          id={props.id}
          type="month"
          aria-label="End date"
          aria-invalid={props.error ? true : undefined}
          disabled={props.isPresent}
          className="min-w-0 flex-1 basis-40"
          value={props.value ?? ''}
          onChange={(event) =>
            props.onValueChange(
              event.target.value.trim() === '' ? undefined : event.target.value,
            )
          }
        />

        <div className="flex shrink-0 items-center gap-2">
          <SyncSwitch
            checked={props.isPresent}
            onCheckedChange={props.onPresentChange}
            label="I currently work here"
          />
          <span className="text-sm font-medium text-gray-900">
            I currently work here
          </span>
        </div>
      </div>

      {props.error && (
        <p role="alert" className="text-xs text-red-700">
          {props.error}
        </p>
      )}
    </div>
  )
}

type RoleEditorProps = {
  sectionIndex: number
  companyIndex: number
  roleIndex: number
  role: ExperienceCompanyRole
  isFirst: boolean
  isLast: boolean
  onChange: (role: ExperienceCompanyRole) => void
  onMove: (from: number, to: number) => void
  onRemove: () => void
}

export function RoleEditor(props: Readonly<RoleEditorProps>) {
  const {
    sectionIndex,
    companyIndex,
    roleIndex,
    role,
    isFirst,
    isLast,
    onChange,
  } = props
  const roleLabel = `role ${roleIndex + 1}`

  const {
    formState: { errors },
  } = useResumeFieldContext()

  const roleErrors = getSectionErrors(errors, sectionIndex)?.companies?.[
    companyIndex
  ]?.roles?.[roleIndex]

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-start sm:gap-2">
        <div className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-white p-3">
          <div className="grid gap-3 sm:grid-cols-2">
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
                onChange={(event) =>
                  onChange({ ...role, job_title: event.target.value })
                }
              />
            </Field>

            <Field
              label="Employment type"
              inputId={`section-${sectionIndex}-company-${companyIndex}-role-${roleIndex}-type`}
            >
              <Input
                id={`section-${sectionIndex}-company-${companyIndex}-role-${roleIndex}-type`}
                placeholder="Full-time"
                value={role.employment_type ?? ''}
                onChange={(event) =>
                  onChange({
                    ...role,
                    employment_type:
                      event.target.value.trim() === ''
                        ? undefined
                        : event.target.value,
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
                value={role.location ?? ''}
                onChange={(event) =>
                  onChange({
                    ...role,
                    location:
                      event.target.value.trim() === ''
                        ? undefined
                        : event.target.value,
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
                value={role.start_date ?? ''}
                onChange={(event) =>
                  onChange({
                    ...role,
                    start_date:
                      event.target.value.trim() === ''
                        ? undefined
                        : event.target.value,
                  })
                }
              />
            </Field>

            <EndDateField
              id={`section-${sectionIndex}-company-${companyIndex}-role-${roleIndex}-end`}
              value={role.end_date}
              error={roleErrors?.end_date?.message}
              isPresent={role.end_date === undefined}
              onValueChange={(end_date) => onChange({ ...role, end_date })}
              onPresentChange={(present) =>
                onChange({ ...role, end_date: present ? undefined : '' })
              }
            />
          </div>

          <div className="mt-3">
            <BulletsEditor
              sectionIndex={sectionIndex}
              companyIndex={companyIndex}
              roleIndex={roleIndex}
              roleLabel={roleLabel}
              bullets={role.bullets}
              onChange={(bullets) => onChange({ ...role, bullets })}
            />
          </div>
        </div>

        <ItemControls
          label={roleLabel}
          index={roleIndex}
          isFirst={isFirst}
          isLast={isLast}
          onMove={props.onMove}
          onRemove={props.onRemove}
          className="self-start pt-7.5 max-sm:pt-0"
        />
      </div>
    </div>
  )
}

type CompanyRowProps = {
  sectionIndex: number
  company: ExperienceCompany
  index: number
  isFirst: boolean
  isLast: boolean
  onChange: (company: ExperienceCompany) => void
  onMove: (from: number, to: number) => void
  onRemove: () => void
}

export function CompanyRow(props: Readonly<CompanyRowProps>) {
  const {
    sectionIndex,
    company,
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

  const companyErrors = getSectionErrors(errors, sectionIndex)?.companies?.[
    index
  ]

  const isCurrentRole = company.end_date === undefined

  const update = (patch: Partial<ExperienceCompany>) =>
    onChange({ ...company, ...patch })

  const roles = company.roles

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-gray-200 p-3">
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-start sm:gap-2">
        <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-2">
          <Field
            label="Company"
            inputId={`section-${sectionIndex}-company-${index}-name`}
            required
            error={companyErrors?.company_name?.message}
          >
            <Input
              id={`section-${sectionIndex}-company-${index}-name`}
              placeholder="Spotify"
              aria-invalid={companyErrors?.company_name ? true : undefined}
              value={company.company_name}
              onChange={(event) => update({ company_name: event.target.value })}
            />
          </Field>

          <Field
            label="Website"
            inputId={`section-${sectionIndex}-company-${index}-website`}
          >
            <Input
              id={`section-${sectionIndex}-company-${index}-website`}
              placeholder="https://example.com"
              value={company.company_website ?? ''}
              onChange={(event) =>
                update({
                  company_website:
                    event.target.value.trim() === ''
                      ? undefined
                      : event.target.value,
                })
              }
            />
          </Field>

          <Field
            label="Start date"
            inputId={`section-${sectionIndex}-company-${index}-start`}
            required
            error={companyErrors?.start_date?.message}
          >
            <Input
              id={`section-${sectionIndex}-company-${index}-start`}
              type="month"
              aria-invalid={companyErrors?.start_date ? true : undefined}
              value={company.start_date}
              onChange={(event) => update({ start_date: event.target.value })}
            />
          </Field>

          <EndDateField
            id={`section-${sectionIndex}-company-${index}-end`}
            value={company.end_date}
            error={companyErrors?.end_date?.message}
            isPresent={isCurrentRole}
            onValueChange={(end_date) => update({ end_date })}
            onPresentChange={(present) =>
              update({ end_date: present ? undefined : '' })
            }
          />
        </div>

        <ItemControls
          label={`company ${index + 1}`}
          index={index}
          isFirst={isFirst}
          isLast={isLast}
          onMove={onMove}
          onRemove={onRemove}
          className="self-start pt-7.5 max-sm:pt-0"
        />
      </div>

      <div className="flex flex-col gap-3">
        {roles.map((role, roleIndex) => (
          <RoleEditor
            key={itemKey(role, roleIndex)}
            sectionIndex={sectionIndex}
            companyIndex={index}
            roleIndex={roleIndex}
            role={role}
            isFirst={roleIndex === 0}
            isLast={roleIndex === roles.length - 1}
            onChange={(next) =>
              onChange({
                ...company,
                roles: roles.map((current, i) =>
                  i === roleIndex ? next : current,
                ),
              })
            }
            onMove={(from, to) => {
              const next = [...roles]
              ;[next[from], next[to]] = [next[to], next[from]]
              onChange({ ...company, roles: next })
            }}
            onRemove={() =>
              onChange({
                ...company,
                roles: roles.filter((_, i) => i !== roleIndex),
              })
            }
          />
        ))}

        <AddItemButton
          label="Add role"
          onAdd={() =>
            onChange({
              ...company,
              roles: [
                ...roles,
                withKey({
                  job_title: '',
                  employment_type: undefined,
                  location: undefined,
                  start_date: undefined,
                  end_date: '',
                  bullets: [],
                }),
              ],
            })
          }
        />
      </div>
    </div>
  )
}

type CompaniesEditorProps = {
  sectionIndex: number
  companies: ExperienceCompany[]
  onChange: (companies: ExperienceCompany[]) => void
}

export function CompaniesEditor(props: Readonly<CompaniesEditorProps>) {
  const { sectionIndex, companies, onChange } = props

  const {
    formState: { errors },
  } = useResumeFieldContext()

  const sectionError = getSectionErrors(errors, sectionIndex)?.companies
    ?.message

  return (
    <div className="flex flex-col gap-3">
      {sectionError && (
        <p role="alert" className="text-sm text-red-700">
          {sectionError}
        </p>
      )}

      {companies.map((company, index) => (
        <CompanyRow
          key={itemKey(company, index)}
          sectionIndex={sectionIndex}
          company={company}
          index={index}
          isFirst={index === 0}
          isLast={index === companies.length - 1}
          onChange={(next) =>
            onChange(
              companies.map((current, i) => (i === index ? next : current)),
            )
          }
          onMove={(from, to) => {
            const next = [...companies]
            ;[next[from], next[to]] = [next[to], next[from]]
            onChange(next)
          }}
          onRemove={() => onChange(companies.filter((_, i) => i !== index))}
        />
      ))}

      <AddItemButton
        label="Add company"
        onAdd={() =>
          onChange([
            ...companies,
            withKey({
              company_name: '',
              start_date: '',
              end_date: undefined,
              roles: [],
            }),
          ])
        }
      />
    </div>
  )
}
