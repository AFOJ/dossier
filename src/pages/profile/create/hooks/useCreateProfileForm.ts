import { useForm, useFormContext } from 'react-hook-form'
import { useSubmit, useNavigation } from 'react-router-dom'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

export type CreateProfileFormData = z.infer<typeof profileSchema>

export function useCreateProfileForm(
  defaultValues?: Partial<CreateProfileFormData>,
) {
  const submit = useSubmit()
  const navigation = useNavigation()
  const isSubmitting = navigation.state === 'submitting'

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

  const onSubmit = form.handleSubmit((data) => {
    // @todo: Finish this.
    submit(data as unknown as string, {
      method: 'post',
      encType: 'application/json',
    })
  })

  return {
    form,
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
  phone: z.string().optional(),
  email: z.email('Invalid email address').or(z.literal('')),
  socials: z.array(
    z.object({
      label: z.string().min(1, 'Label is required'),
      url: z.url('Must be a valid URL'),
    }),
  ),
})
