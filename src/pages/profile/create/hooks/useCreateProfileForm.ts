import { useForm, useFormContext } from 'react-hook-form'
import { useSubmit, useNavigation } from 'react-router-dom'

export type CreateProfileFormData = {
  fullName: string
  location: string
  phone: string
  email: string
  socials: { label: string; url: string }[]
}

export function useCreateProfileForm(
  defaultValues?: Partial<CreateProfileFormData>,
) {
  const submit = useSubmit()
  const navigation = useNavigation()
  const isSubmitting = navigation.state === 'submitting'

  const form = useForm<CreateProfileFormData>({
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
