import { useState } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { Controller, FormProvider } from "react-hook-form"
import { Button, Card, Field, Heading1, Heading2, Input, Subheading } from "@/components/ui"
import { RadioGroup } from "@base-ui/react/radio-group"
import { Radio } from "@base-ui/react/radio"
import { useModal } from "@/components/modal"
import { useToast } from "@/components/toast"
import { usePageTitle } from "@/hooks/usePageTitle"
import { SyncSwitch } from "@/pages/resumes/create/components/SyncSwitch"
import { db } from "@/db/db"
import { exportProfile } from "@/db/profile"
import { downloadJson, getExportFilename } from "@/lib/download"
import { DeleteAllDataDialog } from "@/pages/settings/components/DeleteAllDataDialog"
import { useSettingsForm } from "@/pages/settings/hooks/useSettingsForm"

export default function SettingsPage() {
  usePageTitle("Settings")

  return (
    <section className="flex max-w-[880px] flex-col gap-8 pb-20">
      <header>
        <Heading1>Settings</Heading1>
        <Subheading>Defaults for new documents, your data, and backups.</Subheading>
      </header>

      <DocumentsSection />
      <DataSection />
      <DangerZone />
    </section>
  )
}

function DocumentsSection() {
  const { form, onSubmit } = useSettingsForm()

  const pdfFilenamePattern = form.watch("pdfFilenamePattern")
  const isShared = pdfFilenamePattern === "shared"

  const pdfFields = isShared ? (
    <div className="mt-3">
      <Field
        label="PDF filename"
        inputId="defaultPdfFilenameFormat"
        error={form.formState.errors.defaultPdfFilenameFormat?.message}
      >
        <Input
          id="defaultPdfFilenameFormat"
          placeholder="{title}-{kind}.pdf"
          {...form.register("defaultPdfFilenameFormat")}
          className="h-8 border-[#d1d9e0] px-3 font-mono text-[13px]"
        />
      </Field>
      <p className="mb-3 mt-1.5 text-xs text-[#59636e]">
        One format for both resumes and cover letters. Use{" "}
        <code className="rounded-md bg-gray-100 px-[5px] py-[2px] font-mono text-[11.5px]">
          {"{title}"}
        </code>{" "}
        for the filename-safe title,{" "}
        <code className="rounded-md bg-gray-100 px-[5px] py-[2px] font-mono text-[11.5px]">
          {"{kind}"}
        </code>{" "}
        to insert "resume" or "cover-letter". Date tokens such as{" "}
        <code className="rounded-md bg-gray-100 px-[5px] py-[2px] font-mono text-[11.5px]">
          {"{dateShort}"}
        </code>{" "}
        and{" "}
        <code className="rounded-md bg-gray-100 px-[5px] py-[2px] font-mono text-[11.5px]">
          {"{year}"}
        </code>
        are available. A `.pdf` suffix is added automatically.
      </p>
    </div>
  ) : (
    <>
      <div className="mt-3">
        <Field
          label="Resume PDF filename"
          inputId="defaultResumePdfFilenameFormat"
          error={form.formState.errors.defaultResumePdfFilenameFormat?.message}
        >
          <Input
            id="defaultResumePdfFilenameFormat"
            placeholder="{title}-resume.pdf"
            {...form.register("defaultResumePdfFilenameFormat")}
            className="h-8 border-[#d1d9e0] px-3 font-mono text-[13px]"
          />
        </Field>
        <p className="mb-3 mt-1.5 text-xs text-[#59636e]">
          Format for resume PDFs. Use{" "}
          <code className="rounded-md bg-gray-100 px-[5px] py-[2px] font-mono text-[11.5px]">
            {"{title}"}
          </code>{" "}
          for the filename-safe title. Date tokens such as{" "}
          <code className="rounded-md bg-gray-100 px-[5px] py-[2px] font-mono text-[11.5px]">
            {"{dateShort}"}
          </code>{" "}
          and{" "}
          <code className="rounded-md bg-gray-100 px-[5px] py-[2px] font-mono text-[11.5px]">
            {"{year}"}
          </code>
          are available. A `.pdf` suffix is added automatically.
        </p>
      </div>

      <div className="mt-1.5">
        <Field
          label="Cover letter PDF filename"
          inputId="defaultCoverLetterPdfFilenameFormat"
          error={form.formState.errors.defaultCoverLetterPdfFilenameFormat?.message}
        >
          <Input
            id="defaultCoverLetterPdfFilenameFormat"
            placeholder="{title}-cover-letter.pdf"
            {...form.register("defaultCoverLetterPdfFilenameFormat")}
            className="h-8 border-[#d1d9e0] px-3 font-mono text-[13px]"
          />
        </Field>
        <p className="mb-3 mt-1.5 text-xs text-[#59636e]">
          Format for cover letter PDFs. Use{" "}
          <code className="rounded-md bg-gray-100 px-[5px] py-[2px] font-mono text-[11.5px]">
            {"{title}"}
          </code>{" "}
          for the filename-safe title. Date tokens such as{" "}
          <code className="rounded-md bg-gray-100 px-[5px] py-[2px] font-mono text-[11.5px]">
            {"{dateShort}"}
          </code>
          and{" "}
          <code className="rounded-md bg-gray-100 px-[5px] py-[2px] font-mono text-[11.5px]">
            {"{year}"}
          </code>
          are available. A `.pdf` suffix is added automatically.
        </p>
      </div>
    </>
  )

  return (
    <div className="flex flex-col gap-4">
      <Heading2>Documents</Heading2>

      <FormProvider {...form}>
        <form onSubmit={onSubmit} className="contents">
          <div className="flex items-start gap-3">
            <Controller
              control={form.control}
              name="defaultSyncProfile"
              render={({ field }) => (
                <SyncSwitch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  label="Sync new documents to my profile"
                />
              )}
            />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900">
                Sync new documents to my profile
              </p>
              <p className="mt-1 text-xs text-[#59636e]">
                New resumes and cover letters start with your profile contact details. Turn this off
                to give every new document its own contact details.
              </p>
            </div>
          </div>

          <div className="mt-3">
            <Field
              label="Export filename format"
              inputId="defaultExportFilenameFormat"
              error={form.formState.errors.defaultExportFilenameFormat?.message}
            >
              <Input
                id="defaultExportFilenameFormat"
                placeholder="{kind}-{title}-export-{dateShort}"
                {...form.register("defaultExportFilenameFormat")}
                className="h-8 border-[#d1d9e0] px-3 font-mono text-[13px]"
              />
            </Field>
            <p className="mb-3 mt-1.5 text-xs text-[#59636e]">
              Used for exported file names. Use{" "}
              <code className="rounded-md bg-gray-100 px-[5px] py-[2px] font-mono text-[11.5px]">
                {"{kind}"}
              </code>{" "}
              <code className="rounded-md bg-gray-100 px-[5px] py-[2px] font-mono text-[11.5px]">
                {"{title}"}
              </code>{" "}
              <code className="rounded-md bg-gray-100 px-[5px] py-[2px] font-mono text-[11.5px]">
                {"{dateShort}"}
              </code>{" "}
              <code className="rounded-md bg-gray-100 px-[5px] py-[2px] font-mono text-[11.5px]">
                {"{date}"}
              </code>{" "}
              <code className="rounded-md bg-gray-100 px-[5px] py-[2px] font-mono text-[11.5px]">
                {"{year}"}
              </code>{" "}
              <code className="rounded-md bg-gray-100 px-[5px] py-[2px] font-mono text-[11.5px]">
                {"{month}"}
              </code>{" "}
              <code className="rounded-md bg-gray-100 px-[5px] py-[2px] font-mono text-[11.5px]">
                {"{monthShort}"}
              </code>{" "}
              or{" "}
              <code className="rounded-md bg-gray-100 px-[5px] py-[2px] font-mono text-[11.5px]">
                {"{day}"}
              </code>
              . Invalid filename characters are removed automatically.
            </p>
          </div>

          <div className="mt-3">
            <Field label="PDF filename pattern" inputId="pdfFilenamePattern">
              <Controller
                control={form.control}
                name="pdfFilenamePattern"
                render={({ field }) => (
                  <RadioGroup
                    name="pdfFilenamePattern"
                    value={field.value}
                    onValueChange={field.onChange}
                    className="flex items-center gap-4"
                  >
                    <label className="flex cursor-pointer items-center gap-2">
                      <Radio.Root
                        value="shared"
                        className="flex h-4 w-4 items-center justify-center rounded-full border-2 border-gray-300 transition-colors focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2 focus-visible:outline-none data-[checked]:border-gray-900 dark:border-gray-600 dark:focus-visible:ring-gray-100 dark:data-[checked]:border-gray-100"
                      >
                        <Radio.Indicator className="h-2 w-2 rounded-full bg-gray-900 dark:bg-gray-100" />
                      </Radio.Root>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        Shared
                      </span>
                    </label>
                    <label className="flex cursor-pointer items-center gap-2">
                      <Radio.Root
                        value="ad-hoc"
                        className="flex h-4 w-4 items-center justify-center rounded-full border-2 border-gray-300 transition-colors focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2 focus-visible:outline-none data-[checked]:border-gray-900 dark:border-gray-600 dark:focus-visible:ring-gray-100 dark:data-[checked]:border-gray-100"
                      >
                        <Radio.Indicator className="h-2 w-2 rounded-full bg-gray-900 dark:bg-gray-100" />
                      </Radio.Root>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        Ad Hoc
                      </span>
                    </label>
                  </RadioGroup>
                )}
              />
              <p className="mt-1.5 text-xs text-[#59636e]">
                Shared: one format for both resumes and cover letters using{" "}
                <code className="rounded-md bg-gray-100 px-[5px] py-[2px] font-mono text-[11.5px]">
                  {"{kind}"}
                </code>{" "}
                to distinguish them. Ad Hoc: separate format per document type.
              </p>
            </Field>
          </div>

          {pdfFields}

          <div>
            <Button type="submit" disabled={!form.formState.isDirty}>
              {form.formState.isSubmitting ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </form>
      </FormProvider>
    </div>
  )
}

function DataSection() {
  const [isExporting, setIsExporting] = useState(false)
  const [isClearing, setIsClearing] = useState(false)
  const cacheCount = useLiveQuery(() => db.entityCache.count(), [])
  const toast = useToast()

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const data = await exportProfile()
      downloadJson(getExportFilename("profile"), data)
      toast.success("Data exported", "Your profile and documents were downloaded as JSON.")
    } catch (error) {
      toast.error("Failed to export data", "Please try again.")
      console.error("Failed to export data:", error)
    } finally {
      setIsExporting(false)
    }
  }

  const handleClear = async () => {
    setIsClearing(true)
    try {
      await db.entityCache.clear()
      toast.success("Cached uploads cleared", "Parsed copies of uploaded files were removed.")
    } catch (error) {
      toast.error("Failed to clear cached uploads", "Please try again.")
      console.error("Failed to clear entity cache:", error)
    } finally {
      setIsClearing(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Heading2>Data</Heading2>

      <Card tone="plain" className="gap-0 rounded-[10px] border-[#d1d9e0] p-0">
        <div
          id="export-your-data"
          className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
        >
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900">Export your data</p>
            <p className="mt-1 text-xs text-[#59636e]">
              Downloads your profile, documents, tags, and settings as a JSON file.
            </p>
          </div>
          <Button
            type="button"
            intent="secondary"
            onClick={handleExport}
            disabled={isExporting}
            className="w-full shrink-0 sm:w-auto"
          >
            {isExporting ? "Exporting..." : "Export data"}
          </Button>
        </div>

        <div className="flex flex-col gap-3 border-t border-[#d1d9e0] p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900">Cached uploads</p>
            <p className="mt-1 text-xs text-[#59636e]">
              Dossier keeps parsed copies of uploaded files so it can show you a preview without
              re-reading the original. Those copies stay in this browser.{" "}
              {cacheCount === undefined
                ? "Reading cache..."
                : `${cacheCount} ${cacheCount === 1 ? "file" : "files"} cached.`}
            </p>
          </div>
          <Button
            type="button"
            intent="secondary"
            onClick={handleClear}
            disabled={isClearing || !cacheCount}
            className="w-full shrink-0 sm:w-auto"
          >
            {isClearing ? "Clearing..." : "Clear cached uploads"}
          </Button>
        </div>
      </Card>
    </div>
  )
}

function DangerZone() {
  const deleteModal = useModal(DeleteAllDataDialog, {
    closeOnBackdropClick: false,
    closeOnEscape: false,
  })

  return (
    <div className="flex flex-col gap-4">
      <Heading2 className="text-[#d1242f]">Danger zone</Heading2>

      <Card tone="plain" className="gap-0 rounded-[10px] border-[#cf222e] p-0">
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900">Delete all data</p>
            <p className="mt-1 text-xs text-[#59636e]">
              Permanently removes your profile, documents, tags, and settings from this browser.{" "}
              <a href="#export-your-data" className="text-[#0969da] no-underline hover:underline">
                Export a backup
              </a>{" "}
              first: this cannot be undone.
            </p>
          </div>
          <Button
            type="button"
            intent="secondary"
            onClick={() => deleteModal.open(undefined)}
            className="w-full shrink-0 text-[#d1242f] sm:w-auto"
          >
            Delete all data
          </Button>
        </div>
      </Card>
    </div>
  )
}
