import { useRouteLoaderData } from "react-router-dom"
import { FormProvider } from "react-hook-form"
import type { UseFormClearErrors } from "react-hook-form"
import type { ResumeFormData } from "@/pages/resumes/create/hooks/useCreateResumeForm"
import { Button, Divider, Field, FormSubmitBar, Heading1, Input, Subheading } from "@/components/ui"
import { usePageTitle } from "@/hooks/usePageTitle"
import type { Resume } from "@/db/db"
import { ProfileSyncCard } from "@/pages/resumes/create/components/ProfileSyncCard"
import { SectionAddMenu } from "@/pages/resumes/create/components/SectionAddMenu"
import { SectionList } from "@/pages/resumes/create/components/SectionList"
import { useEditResumeForm } from "@/pages/resumes/edit/hooks/useEditResumeForm"

export default function EditResumePage() {
  const { resume } = useRouteLoaderData("resume-edit") as { resume: Resume }

  usePageTitle("Edit Resume")

  return <EditResumeForm key={resume.id} resume={resume} />
}

function EditResumeForm(props: Readonly<{ resume: Resume }>) {
  const { resume } = props
  const {
    form,
    onSubmit,
    isSubmitting,
    formError,
    isDirty,
    revert,
    addSection,
    removeSection,
    reorderSection,
    updateSection,
    setSyncProfile,
  } = useEditResumeForm(resume)
  const { clearErrors }: { clearErrors: UseFormClearErrors<ResumeFormData> } = form

  return (
    <section className="flex flex-col gap-6 pb-20">
      <header>
        <div className="flex flex-col gap-1">
          <Heading1>Edit resume</Heading1>
          <Subheading>{resume.title}</Subheading>
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
              placeholder="Frontend Engineer Resume"
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
            {isDirty && (
              <Button type="button" intent="secondary" onClick={revert} disabled={isSubmitting}>
                Revert
              </Button>
            )}
            <Button type="submit" disabled={!isDirty || isSubmitting}>
              {isSubmitting ? "Saving..." : "Save changes"}
            </Button>
          </FormSubmitBar>
        </form>
      </FormProvider>
    </section>
  )
}
