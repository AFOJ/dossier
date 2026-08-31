import { useCallback, useMemo, useState } from 'react'
import { useForm, useFormContext } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useToast } from '@/components/toast'
import type { Profile } from '@/db/db'
import { createResume } from '@/db/resume'
import { resumeSectionSchema, type ResumeSectionData } from '@/db/schemas'

const isMonthValue = (value: string) => /^\d{4}-\d{2}$/.test(value)

export const resumeFormSchema = z
  .object({
    title: z.string().min(1, 'Title is required'),
    syncProfile: z.boolean(),
    fullName: z.string().optional(),
    jobTitle: z.string().optional(),
    location: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().optional(),
    socials: z.array(
      z.object({
        label: z.string(),
        url: z.string(),
      }),
    ),
    sections: z.array(resumeSectionSchema),
  })
  .superRefine((data, ctx) => {
    if (data.syncProfile) {
      return
    }

    if ((data.fullName ?? '').trim() === '') {
      ctx.addIssue({
        code: 'custom',
        path: ['fullName'],
        message: 'Full name is required',
      })
    }

    const email = data.email ?? ''
    if (email !== '' && !z.email().safeParse(email).success) {
      ctx.addIssue({
        code: 'custom',
        path: ['email'],
        message: 'Invalid email address',
      })
    }

    data.socials.forEach((social, index) => {
      if (social.label.trim() === '') {
        ctx.addIssue({
          code: 'custom',
          path: ['socials', index, 'label'],
          message: 'Label is required',
        })
      }

      if (!z.url().safeParse(social.url).success) {
        ctx.addIssue({
          code: 'custom',
          path: ['socials', index, 'url'],
          message: 'Must be a valid URL',
        })
      }
    })
  })
  .superRefine((data, ctx) => {
    const addSectionIssue = (
      sectionIndex: number,
      path: (string | number)[],
      message: string,
    ) => {
      ctx.addIssue({
        code: 'custom',
        path: ['sections', sectionIndex, ...path],
        message,
      })
    }

    data.sections.forEach((section, sectionIndex) => {
      switch (section.type) {
        case 'paragraph': {
          if (section.text.trim() === '') {
            addSectionIssue(sectionIndex, ['text'], 'Paragraph cannot be empty')
          }
          break
        }

        case 'education': {
          if (section.institutions.length === 0) {
            addSectionIssue(
              sectionIndex,
              ['institutions'],
              'Add at least one school to this section',
            )
          }

          section.institutions.forEach((institution, institutionIndex) => {
            if (institution.name.trim() === '') {
              addSectionIssue(
                sectionIndex,
                ['institutions', institutionIndex, 'name'],
                'School is required',
              )
            }
            if (institution.degree.trim() === '') {
              addSectionIssue(
                sectionIndex,
                ['institutions', institutionIndex, 'degree'],
                'Degree is required',
              )
            }
          })
          break
        }

        case 'skills': {
          if (section.groups.length === 0) {
            addSectionIssue(
              sectionIndex,
              ['groups'],
              'Add at least one skill group to this section',
            )
          }

          section.groups.forEach((group, groupIndex) => {
            if (group.title.trim() === '') {
              addSectionIssue(
                sectionIndex,
                ['groups', groupIndex, 'title'],
                'Group title is required',
              )
            }
            if (group.items.length === 0) {
              addSectionIssue(
                sectionIndex,
                ['groups', groupIndex, 'items'],
                'Add at least one skill',
              )
            }
          })
          break
        }

        case 'experience': {
          if (section.companies.length === 0) {
            addSectionIssue(
              sectionIndex,
              ['companies'],
              'Add at least one company to this section',
            )
          }

          section.companies.forEach((company, companyIndex) => {
            if (company.company_name.trim() === '') {
              addSectionIssue(
                sectionIndex,
                ['companies', companyIndex, 'company_name'],
                'Company is required',
              )
            }

            if (company.start_date.trim() === '') {
              addSectionIssue(
                sectionIndex,
                ['companies', companyIndex, 'start_date'],
                'Start date is required',
              )
            }

            if (
              company.end_date !== undefined &&
              !isMonthValue(company.end_date)
            ) {
              addSectionIssue(
                sectionIndex,
                ['companies', companyIndex, 'end_date'],
                'End date is required',
              )
            }

            if (
              company.end_date !== undefined &&
              isMonthValue(company.end_date) &&
              isMonthValue(company.start_date) &&
              company.end_date < company.start_date
            ) {
              addSectionIssue(
                sectionIndex,
                ['companies', companyIndex, 'end_date'],
                'End date cannot be before start date',
              )
            }

            company.roles.forEach((role, roleIndex) => {
              if (role.job_title.trim() === '') {
                addSectionIssue(
                  sectionIndex,
                  ['companies', companyIndex, 'roles', roleIndex, 'job_title'],
                  'Job title is required',
                )
              }

              const hasStart = (role.start_date ?? '').trim() !== ''
              const endDateIsNonEmptyInvalid =
                role.end_date !== undefined &&
                role.end_date !== '' &&
                !isMonthValue(role.end_date)
              const hasValidEnd =
                role.end_date !== undefined &&
                role.end_date !== '' &&
                isMonthValue(role.end_date)

              if (endDateIsNonEmptyInvalid) {
                addSectionIssue(
                  sectionIndex,
                  ['companies', companyIndex, 'roles', roleIndex, 'end_date'],
                  'End date is required',
                )
              } else if (role.end_date === '' && hasStart) {
                addSectionIssue(
                  sectionIndex,
                  ['companies', companyIndex, 'roles', roleIndex, 'end_date'],
                  'End date is required',
                )
              } else if (!hasStart && hasValidEnd) {
                addSectionIssue(
                  sectionIndex,
                  ['companies', companyIndex, 'roles', roleIndex, 'start_date'],
                  'Start date is required when an end date is set',
                )
              } else if (
                hasStart &&
                hasValidEnd &&
                role.end_date !== undefined &&
                role.start_date !== undefined &&
                isMonthValue(role.start_date) &&
                isMonthValue(role.end_date) &&
                role.end_date < role.start_date
              ) {
                addSectionIssue(
                  sectionIndex,
                  ['companies', companyIndex, 'roles', roleIndex, 'end_date'],
                  'End date cannot be before start date',
                )
              }

              role.bullets.forEach((bullet, bulletIndex) => {
                if (bullet.type === 'text') {
                  if (bullet.text.trim() === '') {
                    addSectionIssue(
                      sectionIndex,
                      ['companies', companyIndex, 'roles', roleIndex, 'bullets', bulletIndex, 'text'],
                      'Bullet cannot be empty',
                    )
                  }
                  return
                }

                if (bullet.title.trim() === '') {
                  addSectionIssue(
                    sectionIndex,
                    ['companies', companyIndex, 'roles', roleIndex, 'bullets', bulletIndex, 'title'],
                    'Bullet heading is required',
                  )
                }
                if (bullet.text.trim() === '') {
                  addSectionIssue(
                    sectionIndex,
                    ['companies', companyIndex, 'roles', roleIndex, 'bullets', bulletIndex, 'text'],
                    'Bullet text is required',
                  )
                }
              })
            })
          })
          break
        }
      }
    })
  })

export type ResumeFormData = z.infer<typeof resumeFormSchema>

export function useResumeFieldContext() {
  return useFormContext<ResumeFormData>()
}

export interface ParagraphSectionErrors {
  type: 'paragraph'
  title?: { message: string }
  text?: { message: string }
}

export interface EducationInstitutionErrors {
  name?: { message: string }
  degree?: { message: string }
  grade?: { message: string }
  start_date?: { message: string }
  end_date?: { message: string }
  location?: { message: string }
  paragraph?: { message: string }
}

export interface EducationSectionErrors {
  type: 'education'
  title?: { message: string }
  institutions?: EducationInstitutionErrors[] & { message?: string }
}

export interface SkillGroupErrors {
  title?: { message: string }
  items?: { message: string }
}

export interface SkillsSectionErrors {
  type: 'skills'
  title?: { message: string }
  groups?: SkillGroupErrors[] & { message?: string }
}

export interface BulletErrors {
  title?: { message: string }
  text?: { message: string }
}

export interface ExperienceRoleErrors {
  job_title?: { message: string }
  employment_type?: { message: string }
  location?: { message: string }
  start_date?: { message: string }
  end_date?: { message: string }
  bullets?: BulletErrors[] & { message?: string }
}

export interface ExperienceCompanyErrors {
  company_name?: { message: string }
  company_website?: { message: string }
  start_date?: { message: string }
  end_date?: { message: string }
  roles?: ExperienceRoleErrors[] & { message?: string }
}

export interface ExperienceSectionErrors {
  type: 'experience'
  title?: { message: string }
  companies?: ExperienceCompanyErrors[] & { message?: string }
}

export type SectionErrors =
  | ParagraphSectionErrors
  | EducationSectionErrors
  | SkillsSectionErrors
  | ExperienceSectionErrors

export function getSectionErrors(
  errors: unknown,
  sectionIndex: number
): SectionErrors | undefined {
  const nodes = errors as { sections?: SectionErrors[] } | undefined
  return nodes?.sections?.[sectionIndex]
}

export type SectionType = ResumeSectionData['type']

type SectionsApi = {
  setValue: (name: 'sections', value: FormSection[], options?: object) => void
  getValues: (name: 'sections') => FormSection[]
}

export function createSectionMutations({ setValue, getValues }: SectionsApi) {
  const mutateSections = (
    mutate: (sections: FormSection[]) => FormSection[],
  ) => {
    setValue('sections', mutate(getValues('sections')), { shouldDirty: true })
  }

  return {
    addSection: (type: SectionType) => {
      mutateSections((sections) => [...sections, DEFAULT_SECTIONS[type]()])
    },
    removeSection: (index: number) => {
      mutateSections((sections) => sections.filter((_, i) => i !== index))
    },
    moveSection: (index: number, direction: -1 | 1) => {
      mutateSections((sections) => {
        const target = index + direction
        if (target < 0 || target >= sections.length) {
          return sections
        }

        const next = [...sections]
        ;[next[index], next[target]] = [next[target], next[index]]
        return next
      })
    },
    updateSection: (index: number, section: ResumeSectionData) => {
      mutateSections((sections) =>
        sections.map((current, i) =>
          i === index ? ({ ...section } as FormSection) : current,
        ),
      )
    },
  }
}

export type WithKey<T extends object> = T & { _key: string }

export type FormSection = WithKey<ResumeSectionData>

export const withKey = <T extends object>(value: T): T & { _key: string } =>
  ({
    ...value,
    _key: crypto.randomUUID(),
  }) as WithKey<T>

export function itemKey(item: unknown, index: number): string {
  return (item as { _key?: string })._key ?? String(index)
}

const DEFAULT_SECTIONS: Record<SectionType, () => FormSection> = {
  paragraph: () => withKey({ type: 'paragraph', title: '', text: '' }),
  education: () => withKey({ type: 'education', title: '', institutions: [] }),
  skills: () =>
    withKey({
      type: 'skills',
      title: '',
      groups: [withKey({ title: '', items: [] })],
    }),
  experience: () =>
    withKey({
      type: 'experience',
      title: '',
      companies: [
        withKey({
          company_name: '',
          start_date: '',
          end_date: undefined,
          roles: [],
        }),
      ],
    }),
}

export function emptyContactValues() {
  return {
    fullName: '',
    jobTitle: '',
    location: '',
    phone: '',
    email: '',
    socials: [] as { label: string; url: string }[],
  }
}

function toContactValues(profile: Profile) {
  return {
    fullName: profile.full_name,
    jobTitle: profile.role ?? '',
    location: profile.location ?? '',
    phone: profile.phone ?? '',
    email: profile.email ?? '',
    socials: profile.links.map((link) => ({
      label: link.label,
      url: link.url,
    })),
  }
}

export function useCreateResumeForm(profile?: Profile) {
  const toast = useToast()
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<ResumeFormData>({
    resolver: zodResolver(resumeFormSchema),
    defaultValues: {
      title: '',
      syncProfile: true,
      ...(profile
        ? toContactValues(profile)
        : {
            fullName: '',
            jobTitle: '',
            location: '',
            phone: '',
            email: '',
            socials: [],
          }),
      sections: [],
    },
  })

  const { setValue, getValues } = form

  const { addSection, removeSection, moveSection, updateSection } = useMemo(
    () => createSectionMutations({ setValue, getValues }),
    [setValue, getValues],
  )

  const setSyncProfile = useCallback(
    (sync: boolean) => {
      setValue('syncProfile', sync, { shouldDirty: true })

      if (sync && profile) {
        // Turning sync back on discards local edits in favour of the profile.
        Object.entries(toContactValues(profile)).forEach(([key, value]) => {
          ;(
            form as unknown as {
              setValue: (name: string, value: unknown) => void
            }
          ).setValue(key, value)
        })
      }
    },
    [form, profile, setValue],
  )

  const onSubmit = form.handleSubmit(async (data) => {
    try {
      setIsSubmitting(true)
      form.clearErrors('root')

      const contact = data.syncProfile
        ? null
        : {
            full_name: data.fullName ?? '',
            email: data.email || null,
            phone: data.phone || null,
            location: data.location || null,
            links: data.socials,
            role: data.jobTitle || null,
          }

      await createResume(data.title, data.sections, {
        syncProfile: data.syncProfile,
        contact,
      })

      toast.success('Resume created', `"${data.title}" has been created.`)
      navigate('/resumes')
    } catch (error) {
      form.setError('root', {
        type: 'manual',
        message: 'Failed to create resume. Please try again.',
      })
      toast.error('Failed to create resume', 'Please try again.')

      console.error('Failed to create resume:', error)
    } finally {
      setIsSubmitting(false)
    }
  })

  return {
    form,
    onSubmit,
    isSubmitting,
    formError: form.formState.errors.root?.message,
    addSection,
    removeSection,
    moveSection,
    updateSection,
    setSyncProfile,
  }
}
