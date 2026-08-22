import type {
  ExperienceCompanyRoleBullet,
  ExperienceCompany,
  ExperienceCompanyRole,
} from '@/db/types'
import { Field, Input } from '@/components/ui'
import { BulletAddMenu } from '@/pages/resumes/create/components/BulletAddMenu'
import {
  AddItemButton,
  ItemControls,
  type ItemControlsProps,
} from '@/pages/resumes/create/components/SectionCard'

type BulletsEditorProps = {
  roleLabel: string
  bullets: ExperienceCompanyRoleBullet[]
  onChange: (bullets: ExperienceCompanyRoleBullet[]) => void
}

function toBullet(title: string, text: string): ExperienceCompanyRoleBullet {
  return title.trim() !== ''
    ? { type: 'text-with-title', title: title.trim(), text }
    : { type: 'text', text }
}

export function BulletsEditor(props: Readonly<BulletsEditorProps>) {
  const { roleLabel, bullets, onChange } = props

  const move = (from: number, to: number) => {
    const next = [...bullets]
    ;[next[from], next[to]] = [next[to], next[from]]
    onChange(next)
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
            key={index}
            className="flex items-start gap-2 rounded-lg border border-gray-200 p-3"
          >
            <Input
              aria-label={`${roleLabel} bullet ${index + 1}`}
              placeholder="What did you achieve?"
              value={bullet.text}
              className="w-full"
              onChange={(event) =>
                onChange(
                  bullets.map((current, i) =>
                    i === index
                      ? { type: 'text', text: event.target.value }
                      : current,
                  ),
                )
              }
            />
            <ItemControls {...controls} label={`bullet ${index + 1}`} />
          </div>
        ) : (
          <div
            key={index}
            className="flex items-start gap-2 rounded-lg border border-gray-200 p-3"
          >
            <div className="grid flex-1 gap-2 sm:grid-cols-[1fr_2fr]">
              <Input
                aria-label={`${roleLabel} bullet ${index + 1} heading`}
                placeholder="Heading"
                value={bullet.title}
                onChange={(event) =>
                  onChange(
                    bullets.map((current, i) =>
                      i === index
                        ? {
                            type: 'text-with-title',
                            title: event.target.value,
                            text: current.text,
                          }
                        : current,
                    ),
                  )
                }
              />
              <Input
                aria-label={`${roleLabel} bullet ${index + 1} text`}
                placeholder="What did you achieve?"
                value={bullet.text}
                onChange={(event) =>
                  onChange(
                    bullets.map((current, i) =>
                      i === index
                        ? toBullet(bullet.title, event.target.value)
                        : current,
                    ),
                  )
                }
              />
            </div>
            <ItemControls {...controls} label={`bullet ${index + 1}`} />
          </div>
        )
      })}

      <BulletAddMenu onAdd={(bullet) => onChange([...bullets, bullet])} />
    </div>
  )
}

type RoleEditorProps = {
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
  const { companyIndex, roleIndex, role, isFirst, isLast, onChange } = props
  const roleLabel = `role ${roleIndex + 1}`

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-white p-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label="Job title"
              inputId={`company-${companyIndex}-role-${roleIndex}-title`}
              required
            >
              <Input
                id={`company-${companyIndex}-role-${roleIndex}-title`}
                placeholder="Frontend Engineer"
                value={role.job_title}
                onChange={(event) =>
                  onChange({ ...role, job_title: event.target.value })
                }
              />
            </Field>

            <Field
              label="Employment type"
              inputId={`company-${companyIndex}-role-${roleIndex}-type`}
            >
              <Input
                id={`company-${companyIndex}-role-${roleIndex}-type`}
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
              inputId={`company-${companyIndex}-role-${roleIndex}-location`}
            >
              <Input
                id={`company-${companyIndex}-role-${roleIndex}-location`}
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
          </div>

          <div className="mt-3">
            <BulletsEditor
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
        />
      </div>
    </div>
  )
}

type CompanyRowProps = {
  company: ExperienceCompany
  index: number
  isFirst: boolean
  isLast: boolean
  onChange: (company: ExperienceCompany) => void
  onMove: (from: number, to: number) => void
  onRemove: () => void
}

export function CompanyRow(props: Readonly<CompanyRowProps>) {
  const { company, index, isFirst, isLast, onChange, onMove, onRemove } = props

  const update = (patch: Partial<ExperienceCompany>) =>
    onChange({ ...company, ...patch })

  const roles = company.roles

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-gray-200 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="grid flex-1 gap-3 sm:grid-cols-2">
          <Field label="Company" inputId={`company-${index}-name`} required>
            <Input
              id={`company-${index}-name`}
              placeholder="Acme Corp"
              value={company.company_name}
              onChange={(event) => update({ company_name: event.target.value })}
            />
          </Field>

          <Field label="Website" inputId={`company-${index}-website`}>
            <Input
              id={`company-${index}-website`}
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

          <Field label="Start date" inputId={`company-${index}-start`}>
            <Input
              id={`company-${index}-start`}
              placeholder="Jan 2020"
              value={company.start_date}
              onChange={(event) => update({ start_date: event.target.value })}
            />
          </Field>

          <Field label="End date" inputId={`company-${index}-end`}>
            <Input
              id={`company-${index}-end`}
              placeholder=""
              value={company.end_date ?? ''}
              onChange={(event) =>
                update({
                  end_date:
                    event.target.value.trim() === ''
                      ? undefined
                      : event.target.value,
                })
              }
            />
          </Field>
        </div>

        <ItemControls
          label={`company ${index + 1}`}
          index={index}
          isFirst={isFirst}
          isLast={isLast}
          onMove={onMove}
          onRemove={onRemove}
        />
      </div>

      <div className="flex flex-col gap-3">
        {roles.map((role, roleIndex) => (
          <RoleEditor
            key={roleIndex}
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
                {
                  job_title: '',
                  employment_type: undefined,
                  location: undefined,
                  bullets: [],
                },
              ],
            })
          }
        />
      </div>
    </div>
  )
}

type CompaniesEditorProps = {
  companies: ExperienceCompany[]
  onChange: (companies: ExperienceCompany[]) => void
}

export function CompaniesEditor(props: Readonly<CompaniesEditorProps>) {
  const { companies, onChange } = props

  return (
    <div className="flex flex-col gap-3">
      {companies.map((company, index) => (
        <CompanyRow
          key={index}
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
            {
              company_name: '',
              start_date: '',
              end_date: undefined,
              roles: [],
            },
          ])
        }
      />
    </div>
  )
}
