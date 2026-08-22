import { z } from 'zod'
import { useFormContext } from 'react-hook-form'

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

export type ProfileFormData = z.infer<typeof profileSchema>

export function useProfileFieldContext() {
  return useFormContext<ProfileFormData>()
}
