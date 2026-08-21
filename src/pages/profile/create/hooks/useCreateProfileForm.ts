import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { upsertProfile } from '@/db/profile'
import {
  profileSchema,
  type ProfileFormData,
} from '@/pages/profile/schema'

export function useCreateProfileForm(
  defaultValues?: Partial<ProfileFormData>,
) {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: '',
      location: '',
      phone: '',
      email: '',
      socials: [],
      ...defaultValues,
    },
  })

  const onSubmit = form.handleSubmit(async (data) => {
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

      navigate('/resumes')
    } catch (error) {
      form.setError('root', {
        type: 'manual',
        message: 'Failed to save profile. Please try again.',
      })

      console.error('Failed to save profile:', error)
    } finally {
      setIsSubmitting(false)
    }
  })

  return {
    form,
    formError: form.formState.errors.root?.message,
    onSubmit,
    isSubmitting,
  }
}
