import { useForm, useFormContext } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { upsertProfile } from '../../../../db/profile'
import { useState } from 'react'

export type CreateProfileFormData = z.infer<typeof profileSchema>

export function useCreateProfileForm(
  defaultValues?: Partial<CreateProfileFormData>,
) {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<CreateProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: '',
      location: '',
      phone: '',
      email: '',
      socials: [{ label: 'LinkedIn', url: '' }],
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

export function useProfileFormContext() {
  return useFormContext<CreateProfileFormData>()
}

export const profileSchema = z.object({
  fullName: z
    .string()
    .min(1, 'Full name is required')
    .min(2, 'Full name must be at least 2 characters'),
  location: z.string().optional(),
  jobTitle: z.string().optional(),
  phone: z.string().optional(),
  email: z.email('Invalid email address').or(z.literal('')),
  socials: z.array(
    z.object({
      label: z.string().min(1, 'Label is required'),
      url: z.url('Must be a valid URL'),
    }),
  ),
})
