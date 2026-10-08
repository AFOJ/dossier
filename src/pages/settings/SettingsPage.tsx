import { useState } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { Controller, FormProvider } from "react-hook-form"
import { Button, Card, Field, Heading1, Heading2, Input, Subheading } from "@/components/ui"
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
  const isUnified = pdfFilenamePattern === "unified"

  const pdfFields = isUnified ? (
    <div className="mt-4">
      <Field
        label="PDF filename (shared)"
        inputId="defaultPdfFilenameFormat"
        error={form.formState.errors.defaultResumePdfFilenameFormat?.message}
      >
        <Input
          id="defaultPdfFilenameFormat"
          placeholder="{title}-{kind}.pdf"
          {...form.register("defaultResumePdfFilenameFormat")}
          className="h-8 border-[#d1d9e0] px-3 font-mono text-[13px]"
        />
      </Field>
      <p className="mb-3 mt-1.5 text-xs text-[#59636e]">
        Used for both resume and cover letter PDFs. The title is lowercased with spaces as dashes.
        Use{" "}
        <code className="rounded-md bg-gray-100 px-[5px] py-[2px] font-mono text-[11.5px]">
          {"{title}"}
        </code>{" "}
        for the filename-safe title,{" "}
        <code className="rounded-md bg-gray-100 px-[5px] py-[2px] font-mono text=[11.5px]">
          {"{kind}"}
        </code>{" "}
        to insert "resume" or "cover-letter". Date tokens like{" "}
        <code className="rounded-md bg-gray-100 px-[5px] py-[2px] font-mono text=[11.5px]">
          {"{dateShort}"}
        </code>{" "}
        and{" "}
        <code className="rounded-md bg-gray-100 px-[5px] py-[2px] font-mono text-[11.5px]">
          {"{year}"}
        </code>
        are also available. A `.pdf` suffix is added unless the name already ends with one.
      </p>
    </div>
  ) : (
    <>
      <div className="mt-4">
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
          Used for downloaded resume PDFs. The title is lowercased with spaces as dashes. Use{" "}
          <code className="rounded-md bg-gray-100 px-[5px] py-[2px] font-mono text-[11.5px]">
            {"{title}"}
          </code>{" "}
          for the filename-safe title. Date tokens like{" "}
          <code className="rounded-md bg-gray-100 px-[5px] py-[2px] font-mono text-[11.5px]">
            {"{dateShort}"}
          </code>{" "}
          and{" "}
          <code className="rounded-md bg-gray-100 px-[5px] py-[2px] font-mono text=[11.5px]">
            {"{year}"}
          </code>
          are also available. A `.pdf` suffix is added unless the name already ends with one.
        </p>
      </div>

      <div className="mt-4">
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
          Used for downloaded cover letter PDFs. The title is lowercased with spaces as dashes. Use{" "}
          <code className="rounded-md bg-gray-100 px-[5px] py-[2px] font-mono text-[11.5px]">
            {"{title}"}
          </code>{" "}
          for the filename-safe title. Date tokens like{" "}
          <code className="rounded-md bg-gray-100 px-[5px] py-[2px] font-mono text=[11.5px]">
            {"{dateShort}"}
          </code>
          and{" "}
          <code className="rounded-md bg-gray-100 px-[5px] py-[2px] font-mono text-[11.5px]">
            {"{year}"}
          </code>
          are also available. A `.pdf` suffix is added unless the name already ends with one.
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

          <div className="mt-4">
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

          <div className="mt-4">
            <Field label="PDF filename pattern" inputId="pdfFilenamePattern">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="per-kind"
                    {...form.register("pdfFilenamePattern")}
                    className="h-4 w-4 border-gray-300 text-[#0969da] focus:ring-2 focus:ring-[#0969da]"
                  />
                  <span className="text-sm font-medium text-gray-900">Per-kind (explicit)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="unified"
                    {...form.register("pdfFilenamePattern")}
                    className="h-4 w-4 border-gray-300 text-[#0969da] focus:ring-2 focus:ring-[#0969da]"
                  />
                  <span className="text-sm font-medium text-gray-900">
                    Unified (use {"{kind}"})
                  </span>
                </label>
              </div>
              <p className="mt-1.5 text-xs text-[#59636e]">
                Per-kind: each document type has its own format (e.g.{" "}
                <code className="rounded-md bg-gray-100 px-[5px] py-[2px] font-mono text-[11.5px]">
                  {"{title}-resume.pdf"}
                </code>
                /{" "}
                <code className="rounded-md bg-gray-100 px-[5px] py-[2px] font-mono text-[11.5px]">
                  {"{title}-cover-letter.pdf"}
                </code>{" "}
                ). Unified: one shared format using{" "}
                <code className="rounded-md bg-gray-100 px-[5px] py-[2px] font-mono text-[11.5px]">
                  {"{kind}"}
                </code>{" "}
                token (e.g.{" "}
                <code className="rounded-md bg-gray-100 px-[5px] py-[2px] font-mono text-[11.5px]">
                  {"{title}-{kind}.pdf"}
                </code>
                ).
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
        <div id="export-your-data" className="flex items-center justify-between gap-6 p-4">
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
            className="shrink-0"
          >
            {isExporting ? "Exporting..." : "Export data"}
          </Button>
        </div>

        <div className="flex items-center justify-between gap-6 border-t border-[#d1d9e0] p-4">
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
            className="shrink-0"
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
        <div className="flex items-center justify-between gap-6 p-4">
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
            className="shrink-0 text-[#d1242f]"
          >
            Delete all data
          </Button>
        </div>
      </Card>
    </div>
  )
}
