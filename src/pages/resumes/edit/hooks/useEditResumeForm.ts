import { useCallback, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { useToast } from '@/components/toast'
import type { Profile, Resume } from '@/db/db'
import type { ResumeSection } from '@/db/types'
import { updateResume } from '@/db/resume'
import {
  createSectionMutations,
  emptyContactValues,
  resumeFormSchema,
  type FormSection,
  type ResumeFormData,
} from '@/pages/resumes/create/hooks/useCreateResumeForm'

export function useEditResumeForm(resume: Resume, profile?: Profile) {
  const toast = useToast()
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const defaultValues = useMemo(
    () => toEditValues(resume, profile),
    [resume, profile],
  )

  const form = useForm<ResumeFormData>({
    resolver: zodResolver(resumeFormSchema),
    defaultValues,
  })

  const isDirty = form.formState.isDirty

  const revert = useCallback(() => {
    form.reset(defaultValues)
  }, [form, defaultValues])

  const onSubmit = form.handleSubmit(async (data) => {
    try {
      setIsSubmitting(true)
      form.clearErrors('root')

      await updateResume(resume.id!, {
        title: data.title,
        sections: data.sections,
        syncProfile: data.syncProfile,
        contact: data.syncProfile
          ? null
          : {
              full_name: data.fullName ?? '',
              email: data.email || null,
              phone: data.phone || null,
              location: data.location || null,
              links: data.socials,
              role: data.jobTitle || null,
            },
      })

      // Reset to the raw (keyed) current values so the form is pristine
      // without losing the identity keys used for stable list rendering.
      form.reset(form.getValues())
      toast.success('Resume saved', `"${data.title}" has been saved.`)
      navigate('/resumes')
    } catch (error) {
      form.setError('root', {
        type: 'manual',
        message: 'Failed to save resume. Please try again.',
      })
      toast.error('Failed to save resume', 'Please try again.')

      console.error('Failed to save resume:', error)
    } finally {
      setIsSubmitting(false)
    }
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
        Object.entries(
          profileToContactValues(profile),
        ).forEach(([key, value]) => {
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

  return {
    form,
    isDirty,
    isSubmitting,
    revert,
    onSubmit,
    addSection,
    removeSection,
    moveSection,
    updateSection,
    setSyncProfile,
    formError: form.formState.errors.root?.message,
  }
}

function toEditValues(resume: Resume, profile?: Profile): ResumeFormData {
  return {
    title: resume.title,
    syncProfile: resume.syncProfile ?? true,
    ...contactDefaults(resume, profile),
    sections: resume.sections.map((section) => ({
      ...withGeneratedKeys(section),
      _key: crypto.randomUUID(),
    })) as FormSection[],
  }
}

function contactDefaults(resume: Resume, profile?: Profile) {
  if (resume.contact && !resume.syncProfile) {
    return {
      fullName: resume.contact.full_name,
      jobTitle: resume.contact.role ?? '',
      location: resume.contact.location ?? '',
      phone: resume.contact.phone ?? '',
      email: resume.contact.email ?? '',
      socials: resume.contact.links.map((link) => ({
        label: link.label,
        url: link.url,
      })),
    }
  }

  return profile
    ? profileToContactValues(profile)
    : emptyContactValues()
}

function profileToContactValues(profile: Profile) {
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

function withGeneratedKeys(section: ResumeSection): ResumeSection {
  switch (section.type) {
    case 'paragraph':
      return section
    case 'education':
      return {
        ...section,
        institutions: section.institutions.map((institution) => ({
          ...institution,
          _key: crypto.randomUUID(),
        })),
      }
    case 'skills':
      return {
        ...section,
        groups: section.groups.map((group) => ({
          ...group,
          _key: crypto.randomUUID(),
        })),
      }
    case 'experience':
      return {
        ...section,
        companies: section.companies.map((company) => ({
          ...company,
          _key: crypto.randomUUID(),
          roles: company.roles.map((role) => ({
            ...role,
            _key: crypto.randomUUID(),
            bullets: role.bullets.map((bullet) => ({
              ...bullet,
              _key: crypto.randomUUID(),
            })),
          })),
        })),
      }
  }
}
