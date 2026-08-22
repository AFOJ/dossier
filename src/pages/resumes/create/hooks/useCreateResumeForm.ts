import { useCallback, useState } from 'react'
import { useForm, useFormContext } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useToast } from '@/components/toast'
import type { Profile } from '@/db/db'
import { createResume } from '@/db/resume'
import { resumeSectionSchema, type ResumeSectionData } from '@/db/schemas'

const isMonthValue = (value: string) => /^\d{4}-\d{2}$/.test(value)

const resumeFormSchema = z
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

    data.sections.forEach((section, s) => {
      switch (section.type) {
        case 'paragraph': {
          if (section.text.trim() === '') {
            addSectionIssue(s, ['text'], 'Paragraph cannot be empty')
          }
          break
        }

        case 'education': {
          if (section.institutions.length === 0) {
            addSectionIssue(
              s,
              ['institutions'],
              'Add at least one school to this section',
            )
          }

          section.institutions.forEach((institution, i) => {
            if (institution.name.trim() === '') {
              addSectionIssue(s, ['institutions', i, 'name'], 'School is required')
            }
            if (institution.degree.trim() === '') {
              addSectionIssue(s, ['institutions', i, 'degree'], 'Degree is required')
            }
          })
          break
        }

        case 'skills': {
          if (section.groups.length === 0) {
            addSectionIssue(
              s,
              ['groups'],
              'Add at least one skill group to this section',
            )
          }

          section.groups.forEach((group, i) => {
            if (group.title.trim() === '') {
              addSectionIssue(
                s,
                ['groups', i, 'title'],
                'Group title is required',
              )
            }
            if (group.items.length === 0) {
              addSectionIssue(
                s,
                ['groups', i, 'items'],
                'Add at least one skill',
              )
            }
          })
          break
        }

        case 'experience': {
          if (section.companies.length === 0) {
            addSectionIssue(
              s,
              ['companies'],
              'Add at least one company to this section',
            )
          }

          section.companies.forEach((company, c) => {
            if (company.company_name.trim() === '') {
              addSectionIssue(
                s,
                ['companies', c, 'company_name'],
                'Company is required',
              )
            }

            if (company.start_date.trim() === '') {
              addSectionIssue(
                s,
                ['companies', c, 'start_date'],
                'Start date is required',
              )
            }

            if (
              company.end_date !== undefined &&
              isMonthValue(company.end_date) &&
              isMonthValue(company.start_date) &&
              company.end_date < company.start_date
            ) {
              addSectionIssue(
                s,
                ['companies', c, 'end_date'],
                'End date cannot be before start date',
              )
            }

            company.roles.forEach((role, r) => {
              if (role.job_title.trim() === '') {
                addSectionIssue(
                  s,
                  ['companies', c, 'roles', r, 'job_title'],
                  'Job title is required',
                )
              }

              if (
                (role.end_date ?? '').trim() !== '' &&
                (role.start_date ?? '').trim() === ''
              ) {
                addSectionIssue(
                  s,
                  ['companies', c, 'roles', r, 'start_date'],
                  'Start date is required when an end date is set',
                )
              }

              if (
                role.start_date !== undefined &&
                role.end_date !== undefined &&
                isMonthValue(role.start_date) &&
                isMonthValue(role.end_date) &&
                role.end_date < role.start_date
              ) {
                addSectionIssue(
                  s,
                  ['companies', c, 'roles', r, 'end_date'],
                  'End date cannot be before start date',
                )
              }

              role.bullets.forEach((bullet, b) => {
                if (bullet.type === 'text') {
                  if (bullet.text.trim() === '') {
                    addSectionIssue(
                      s,
                      ['companies', c, 'roles', r, 'bullets', b, 'text'],
                      'Bullet cannot be empty',
                    )
                  }
                  return
                }

                if (bullet.title.trim() === '') {
                  addSectionIssue(
                    s,
                    ['companies', c, 'roles', r, 'bullets', b, 'title'],
                    'Bullet heading is required',
                  )
                }
                if (bullet.text.trim() === '') {
                  addSectionIssue(
                    s,
                    ['companies', c, 'roles', r, 'bullets', b, 'text'],
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

/**
 * Section error nodes are a discriminated union, so consumers index into them
 * loosely based on which variant they render.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getSectionErrors(errors: unknown, sectionIndex: number): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nodes = errors as { sections?: any[] } | undefined
  return nodes?.sections?.[sectionIndex]
}

export type SectionType = ResumeSectionData['type']

const DEFAULT_SECTIONS: Record<SectionType, () => ResumeSectionData> = {
  paragraph: () => ({ type: 'paragraph', text: '' }),
  education: () => ({ type: 'education', institutions: [] }),
  skills: () => ({
    type: 'skills',
    groups: [{ title: '', items: [] }],
  }),
  experience: () => ({
    type: 'experience',
    companies: [
      {
        company_name: '',
        start_date: '',
        end_date: undefined,
        employment_type: undefined,
        location: undefined,
        roles: [],
      },
    ],
  }),
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

  const mutateSections = useCallback(
    (mutate: (sections: ResumeSectionData[]) => ResumeSectionData[]) => {
      setValue('sections', mutate(getValues('sections')), {
        shouldDirty: true,
      })
    },
    [getValues, setValue],
  )

  const addSection = useCallback(
    (type: SectionType) => {
      mutateSections((sections) => [...sections, DEFAULT_SECTIONS[type]()])
    },
    [mutateSections],
  )

  const removeSection = useCallback(
    (index: number) => {
      mutateSections((sections) => sections.filter((_, i) => i !== index))
    },
    [mutateSections],
  )

  const moveSection = useCallback(
    (index: number, direction: -1 | 1) => {
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
    [mutateSections],
  )

  const updateSection = useCallback(
    (index: number, section: ResumeSectionData) => {
      mutateSections((sections) =>
        sections.map((current, i) => (i === index ? section : current)),
      )
    },
    [mutateSections],
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
