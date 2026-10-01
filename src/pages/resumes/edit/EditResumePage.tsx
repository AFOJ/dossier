import { useRouteLoaderData } from "react-router-dom"
import { Controller, FormProvider } from "react-hook-form"
import type { UseFormClearErrors } from "react-hook-form"
import type { ResumeFormData } from "@/pages/resumes/create/hooks/useCreateResumeForm"
import {
  Button,
  Divider,
  Field,
  FormSubmitBar,
  Heading1,
  Input,
  Subheading,
  Tooltip,
} from "@/components/ui"
import { usePageTitle } from "@/hooks/usePageTitle"
import { useUndoHotkeys } from "@/hooks/useUndoHotkeys"
import { HistoryButtons } from "@/pages/resumes/create/components/HistoryButtons"
import { TagCombobox } from "@/components/tags"
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
    discard,
    addSection,
    removeSection,
    reorderSection,
    updateSection,
    setSyncProfile,
    undo,
    redo,
    canUndo,
    canRedo,
    nextUndoLabel,
    nextRedoLabel,
  } = useEditResumeForm(resume)
  const { clearErrors }: { clearErrors: UseFormClearErrors<ResumeFormData> } = form

  useUndoHotkeys({ onUndo: undo, onRedo: redo, canUndo, canRedo })

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

          <Field label="Tags" inputId="resume-tags">
            <Controller
              control={form.control}
              name="tagIds"
              render={({ field }) => (
                <TagCombobox
                  value={field.value}
                  onChange={field.onChange}
                  id="resume-tags"
                  ariaLabel="Resume tags"
                />
              )}
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
            <HistoryButtons
              canUndo={canUndo}
              canRedo={canRedo}
              undoLabel={nextUndoLabel}
              redoLabel={nextRedoLabel}
              onUndo={undo}
              onRedo={redo}
              disabled={isSubmitting}
            />
            <Tooltip content={isDirty ? "Discard changes" : "No changes to discard"}>
              <span className="inline-block">
                <Button
                  type="button"
                  intent="secondary"
                  onClick={discard}
                  disabled={!isDirty || isSubmitting}
                >
                  Discard changes
                </Button>
              </span>
            </Tooltip>
            <Button type="submit" disabled={!isDirty || isSubmitting}>
              {isSubmitting ? "Saving..." : "Save changes"}
            </Button>
          </FormSubmitBar>
        </form>
      </FormProvider>
    </section>
  )
}
