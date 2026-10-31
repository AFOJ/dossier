import { Field, Input } from "@/components/ui"
import { useProfileFieldContext } from "@/pages/profile/schema"
import { SocialLinksFields } from "@/pages/profile/components/SocialLinksFields"

export function SetupProfileFields({ step }: Readonly<{ step: number }>) {
  const {
    register,
    formState: { errors },
  } = useProfileFieldContext()
  return (
    <>
      {step === 0 && (
        <fieldset className="min-w-0 space-y-4">
          <legend className="sr-only">About you</legend>
          <Field label="Full name" inputId="fullName" required error={errors.fullName?.message}>
            <Input
              id="fullName"
              autoComplete="name"
              placeholder="Alex Morgan"
              {...register("fullName")}
            />
          </Field>
          <Field
            label="Job title (optional)"
            inputId="job-title"
            description="You can change your job title at any time."
          >
            <Input
              id="job-title"
              autoComplete="organization-title"
              placeholder="Frontend developer"
              {...register("jobTitle")}
            />
          </Field>
        </fieldset>
      )}
      {step === 1 && (
        <fieldset className="min-w-0 space-y-4">
          <legend className="sr-only">Contact details (optional)</legend>
          <Field label="Location" inputId="location">
            <Input
              id="location"
              autoComplete="address-level2"
              placeholder="London, UK"
              {...register("location")}
            />
          </Field>
          <div className="grid gap-4">
            <Field label="Email" inputId="email" error={errors.email?.message}>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="alex@example.com"
                {...register("email")}
              />
            </Field>
            <Field label="Phone" inputId="phone">
              <Input
                id="phone"
                type="tel"
                autoComplete="tel"
                placeholder="+44 7700 900000"
                {...register("phone")}
              />
            </Field>
          </div>
        </fieldset>
      )}
      {step === 2 && <SocialLinksFields showLabels hideLabels headingClassName="sr-only" />}
    </>
  )
}
