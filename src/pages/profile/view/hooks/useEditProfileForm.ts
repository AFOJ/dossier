import { useCallback, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useRevalidator } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import type { Profile } from '@/db/db'
import { upsertProfile } from '@/db/profile'
import {
  profileSchema,
  type ProfileFormData,
} from '@/pages/profile/schema'
import { useToast } from '@/components/toast'

export function toProfileFormData(profile: Profile): ProfileFormData {
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

export function useEditProfileForm(profile: Profile) {
  const toast = useToast()
  const revalidator = useRevalidator()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const defaultValues = useMemo(() => toProfileFormData(profile), [profile])

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues,
  })

  const isDirty = form.formState.isDirty

  const revert = useCallback(() => {
    form.reset(defaultValues)
  }, [form, defaultValues])

  const save = form.handleSubmit(async (data) => {
    try {
      setIsSubmitting(true)
      form.clearErrors('root')

      await upsertProfile({
        full_name: data.fullName,
        email: data.email || null,
        phone: data.phone || null,
        location: data.location || null,
        links: data.socials,
        role: data.jobTitle || null,
      })

      form.reset(data)
      toast.success('Profile saved', 'Your changes have been saved.')
      revalidator.revalidate()
    } catch (error) {
      form.setError('root', {
        type: 'manual',
        message: 'Failed to save profile. Please try again.',
      })
      toast.error('Failed to save profile', 'Please try again.')

      console.error('Failed to save profile:', error)
    } finally {
      setIsSubmitting(false)
    }
  })

  return {
    form,
    isDirty,
    isSubmitting,
    revert,
    save,
    formError: form.formState.errors.root?.message,
  }
}
