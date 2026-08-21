import { Field, Input } from '@/components/ui'
import { useProfileFieldContext } from '@/pages/profile/schema'

export function PersonalInfoFields() {
  const {
    register,
    formState: { errors },
  } = useProfileFieldContext()

  return (
    <div className="grid gap-4">
      <Field
        label="Full name"
        inputId="fullName"
        required
        error={errors.fullName?.message}
      >
        <Input id="fullName" placeholder="John Doe" {...register('fullName')} />
      </Field>

      <Field label="Job Title" inputId="job-title">
        <Input id="job-title" placeholder="Farmer" {...register('jobTitle')} />
      </Field>

      <Field label="Location" inputId="location">
        <Input
          id="location"
          placeholder="London, UK"
          {...register('location')}
        />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Phone" inputId="phone">
          <Input
            id="phone"
            placeholder="+1 (555) 000-0000"
            {...register('phone')}
          />
        </Field>

        <Field label="Email" inputId="email" error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            placeholder="john@doe.com"
            {...register('email')}
          />
        </Field>
      </div>
    </div>
  )
}
