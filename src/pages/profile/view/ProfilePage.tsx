import { useState } from 'react'
import { FormProvider } from 'react-hook-form'
import { Button, Divider, Heading1, Subheading } from '@/components/ui'
import { useModal } from '@/components/modal'
import { useToast } from '@/components/toast'
import { buildExportData } from '@/db/export'
import { downloadJson, getExportFilename } from '@/lib/download'
import { PersonalInfoFields } from '@/pages/profile/components/PersonalInfoFields'
import { SocialLinksFields } from '@/pages/profile/components/SocialLinksFields'
import { usePageTitle } from '@/hooks/usePageTitle'
import useProtectedRouteData from '@/hooks/useProtectedRouteData'
import { DeleteProfileDialog } from '@/pages/profile/view/components/DeleteProfileDialog'
import { useEditProfileForm } from '@/pages/profile/view/hooks/useEditProfileForm'

export default function ProfilePage() {
  const { profile } = useProtectedRouteData()
  const { form, isDirty, isSubmitting, revert, save, formError } =
    useEditProfileForm(profile)
  const deleteModal = useModal(DeleteProfileDialog, {
    closeOnBackdropClick: false,
    closeOnEscape: true,
  })
  const toast = useToast()
  const [isExporting, setIsExporting] = useState(false)

  usePageTitle('Manage your profile')

  const handleExport = async () => {
    try {
      setIsExporting(true)

      const data = await buildExportData()
      downloadJson(getExportFilename('profile'), data)

      toast.success(
        'Profile data exported',
        'Your profile and resumes were downloaded as JSON.',
      )
    } catch (error) {
      toast.error('Failed to export data', 'Please try again.')
      console.error('Failed to export data:', error)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <section className="flex flex-col gap-6">
      <header>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-1">
            <Heading1>Profile</Heading1>
            <Subheading>
              This information is reused across all your resumes.
            </Subheading>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              intent="secondary"
              onClick={handleExport}
              disabled={isExporting}
            >
              {isExporting ? 'Exporting...' : 'Export data'}
            </Button>
            <Button type="button" onClick={() => deleteModal.open(undefined)}>
              Delete
            </Button>
          </div>
        </div>
      </header>

      <FormProvider {...form}>
        <form onSubmit={save} className="contents">
          <PersonalInfoFields />

          <Divider className="border-gray-300" />
          <SocialLinksFields />

          {formError && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-gray-600">
              {formError}
            </div>
          )}

          <div className="flex justify-end gap-2">
            {isDirty && (
              <Button
                type="button"
                intent="secondary"
                onClick={revert}
                disabled={isSubmitting}
              >
                Revert
              </Button>
            )}
            <Button type="submit" disabled={!isDirty || isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save changes'}
            </Button>
          </div>
        </form>
      </FormProvider>
    </section>
  )
}
