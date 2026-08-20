import { Button, Divider, Heading1, Subheading } from '../../../components/ui'
import { FormProvider } from 'react-hook-form'
import { usePageTitle } from '../../../hooks/usePageTitle'
import { PersonalInfoFields } from './components/PersonalInfoFields'
import { SocialLinksFields } from './components/SocialLinksFields'
import { useCreateProfileForm } from './hooks/useCreateProfileForm'

export default function CreateProfilePage() {
  const { form, isSubmitting, onSubmit, formError } = useCreateProfileForm()

  usePageTitle('Create Profile')

  return (
    <main className="w-full flex justify-center">
      <section className="flex flex-col gap-10 p-4 w-full max-w-4xl mt-20 ">
        <div className="flex flex-col items-center justify-center gap-1">
          <Heading1 className="text-center">Get started with Dossier</Heading1>
          <Subheading className="text-center">
            Let's set up your profile first. This information will be reused
            across all your resumes.
          </Subheading>
        </div>

        <FormProvider {...form}>
          <form onSubmit={onSubmit} className="contents">
            <PersonalInfoFields />

            <Divider className="border-gray-300" />
            <SocialLinksFields />

            {formError && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-gray-600">
                {formError}
              </div>
            )}

            <Button type="submit" disabled={isSubmitting}>
              Create My Profile
            </Button>
          </form>
        </FormProvider>
      </section>
    </main>
  )
}
