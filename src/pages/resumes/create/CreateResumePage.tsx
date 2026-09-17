import { FormProvider } from "react-hook-form"
import type { UseFormClearErrors } from "react-hook-form"
import { Button, Divider, Field, FormSubmitBar, Heading1, Input, Subheading } from "@/components/ui"
import { usePageTitle } from "@/hooks/usePageTitle"
import useProtectedRouteData from "@/hooks/useProtectedRouteData"
import { ProfileSyncCard } from "@/pages/resumes/create/components/ProfileSyncCard"
import { SectionAddMenu } from "@/pages/resumes/create/components/SectionAddMenu"
import { SectionList } from "@/pages/resumes/create/components/SectionList"
import {
  useCreateResumeForm,
  type ResumeFormData,
} from "@/pages/resumes/create/hooks/useCreateResumeForm"

export default function CreateResumePage() {
  const { profile } = useProtectedRouteData()
  const {
    form,
    onSubmit,
    isSubmitting,
    formError,
    addSection,
    removeSection,
    reorderSection,
    updateSection,
    setSyncProfile,
  } = useCreateResumeForm(profile)
  const { clearErrors }: { clearErrors: UseFormClearErrors<ResumeFormData> } = form

  usePageTitle("Create Resume")

  return (
    <section className="flex flex-col gap-6 pb-20">
      <header>
        <div className="flex flex-col gap-1">
          <Heading1>Create Resume</Heading1>
          <Subheading>Start building a new resume.</Subheading>
        </div>
      </header>

      <FormProvider {...form}>
        <form onSubmit={onSubmit} className="contents">
          <Field
            label="Title"
            inputId="resume-title"
            required
            description="Doesn't appear on the resume itself."
            error={form.formState.errors.title?.message}
          >
            <Input
              id="resume-title"
              placeholder="Data Analyst Resume"
              {...form.register("title")}
            />
          </Field>

          <Divider className="border-gray-300" />

          <ProfileSyncCard control={form.control} onSyncChange={setSyncProfile} />

          <Divider className="border-gray-300" />

          <SectionList
            control={form.control}
            updateSection={updateSection}
            reorderSection={reorderSection}
            removeSection={removeSection}
            clearErrors={clearErrors}
          />

          <SectionAddMenu onSelect={addSection} />

          {formError && (
            <div className="rounded-[10px] bg-red-50 border border-red-200 p-4 text-sm text-gray-600">
              {formError}
            </div>
          )}

          <FormSubmitBar>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create resume"}
            </Button>
          </FormSubmitBar>
        </form>
      </FormProvider>
    </section>
  )
}
