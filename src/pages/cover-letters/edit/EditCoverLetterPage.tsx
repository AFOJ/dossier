import { Suspense, lazy } from "react"
import { useRouteLoaderData } from "react-router-dom"
import { Controller, FormProvider } from "react-hook-form"
import { Button, Divider, Field, Heading1, Input, Subheading } from "@/components/ui"
import { usePageTitle } from "@/hooks/usePageTitle"
import type { CoverLetter } from "@/db/db"
import { CoverLetterSyncCard } from "@/pages/cover-letters/create/components/CoverLetterSyncCard"
import { useEditCoverLetterForm } from "@/pages/cover-letters/edit/hooks/useEditCoverLetterForm"

const RichTextEditor = lazy(() => {
  return import("@/components/ui/RichTextEditor").then((module) => {
    return {
      default: module.RichTextEditor,
    }
  })
})

export default function EditCoverLetterPage() {
  const { coverLetter } = useRouteLoaderData("cover-letter-edit") as { coverLetter: CoverLetter }

  usePageTitle("Edit Cover Letter")

  return <EditCoverLetterForm key={coverLetter.id} coverLetter={coverLetter} />
}

function EditCoverLetterForm({ coverLetter }: Readonly<{ coverLetter: CoverLetter }>) {
  const { form, onSubmit, isSubmitting, formError, isDirty, revert, setSyncProfile } =
    useEditCoverLetterForm(coverLetter)

  return (
    <section className="flex flex-col gap-6">
      <header>
        <div className="flex flex-col gap-1">
          <Heading1>Edit cover letter</Heading1>
          <Subheading>{coverLetter.title}</Subheading>
        </div>
      </header>

      <FormProvider {...form}>
        <form onSubmit={onSubmit} className="contents">
          <Field
            label="Title"
            inputId="cover-letter-title"
            required
            description="Doesn't appear on the letter itself."
            error={form.formState.errors.title?.message}
          >
            <Input
              id="cover-letter-title"
              placeholder="Backend Engineer Application"
              {...form.register("title")}
            />
          </Field>

          <Divider className="border-gray-300" />

          <CoverLetterSyncCard control={form.control} onSyncChange={setSyncProfile} />

          <Divider className="border-gray-300" />

          <Field
            label="Subject"
            inputId="cover-letter-subject"
            error={form.formState.errors.subject?.message}
          >
            <Input
              id="cover-letter-subject"
              placeholder="Application for Backend Engineer"
              {...form.register("subject")}
            />
          </Field>

          <Field
            label="Body"
            inputId="cover-letter-body"
            required
            error={form.formState.errors.body?.message}
          >
            <Suspense
              fallback={
                <div className="rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-400">
                  Loading editor…
                </div>
              }
            >
              <Controller
                control={form.control}
                name="body"
                render={({ field, fieldState }) => {
                  return (
                    <RichTextEditor
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      placeholder="Write your cover letter…"
                      invalid={Boolean(fieldState.error)}
                      label="Cover letter body"
                    />
                  )
                }}
              />
            </Suspense>
          </Field>

          <Field
            label="Sign-off"
            inputId="cover-letter-signoff"
            error={form.formState.errors.signoff?.message}
          >
            <Input
              id="cover-letter-signoff"
              placeholder="Kind regards,"
              {...form.register("signoff")}
            />
          </Field>

          {formError && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-gray-600">
              {formError}
            </div>
          )}

          <div className="flex justify-end gap-2">
            {isDirty && (
              <Button type="button" intent="secondary" onClick={revert} disabled={isSubmitting}>
                Revert
              </Button>
            )}
            <Button type="submit" disabled={!isDirty || isSubmitting}>
              {isSubmitting ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </form>
      </FormProvider>
    </section>
  )
}
