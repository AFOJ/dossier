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
    <section className="flex flex-col gap-6 pb-20">
      <header>
        <div className="flex flex-col gap-1">
          <Heading1>Settings</Heading1>
          <Subheading>Defaults for new documents, your data, and backups.</Subheading>
        </div>
      </header>

      <DocumentsSection />
      <DataSection />
      <BackupSection />
      <DangerZone />
    </section>
  )
}

function DocumentsSection() {
  const { form, onSubmit } = useSettingsForm()

  return (
    <div className="flex flex-col gap-4">
      <Heading2>Documents</Heading2>

      <FormProvider {...form}>
        <form onSubmit={onSubmit} className="contents">
          <Card className="gap-4">
            <div className="flex items-center gap-3">
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
              <span className="text-sm font-medium text-gray-900">
                Sync new documents to my profile
              </span>
            </div>
            <p className="text-sm text-gray-700">
              New resumes and cover letters start with your profile contact details. Turn this off
              to give every new document its own contact details.
            </p>
          </Card>

          <Card className="gap-4">
            <Field
              label="Export filename format"
              inputId="defaultExportFilenameFormat"
              error={form.formState.errors.defaultExportFilenameFormat?.message}
            >
              <Input
                id="defaultExportFilenameFormat"
                placeholder="{kind}-{title}-export-{dateShort}"
                {...form.register("defaultExportFilenameFormat")}
              />
            </Field>
            <p className="text-sm text-gray-700">
              Used for exported file names. Use{" "}
              <code className="rounded bg-gray-100 px-1">{"{kind}"}</code>,{" "}
              <code className="rounded bg-gray-100 px-1">{"{title}"}</code>,{" "}
              <code className="rounded bg-gray-100 px-1">{"{dateShort}"}</code>,{" "}
              <code className="rounded bg-gray-100 px-1">{"{date}"}</code>,{" "}
              <code className="rounded bg-gray-100 px-1">{"{year}"}</code>,{" "}
              <code className="rounded bg-gray-100 px-1">{"{month}"}</code>,{" "}
              <code className="rounded bg-gray-100 px-1">{"{monthShort}"}</code>, or{" "}
              <code className="rounded bg-gray-100 px-1">{"{day}"}</code>.{" "}
              Invalid filename characters are removed automatically.
            </p>
          </Card>

          <div className="flex justify-end">
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
  const [isClearing, setIsClearing] = useState(false)
  const cacheCount = useLiveQuery(() => db.entityCache.count(), [])
  const toast = useToast()

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

      <Card className="gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-semibold text-gray-900">Cached uploads</p>
          <p className="text-sm text-gray-700">
            Dossier keeps parsed copies of uploaded files so it can show you a preview without
            re-reading the original. Those copies stay in this browser.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-gray-500">
            {cacheCount === undefined
              ? "Reading cache..."
              : `${cacheCount} ${cacheCount === 1 ? "file" : "files"} cached`}
          </p>
          <Button
            type="button"
            intent="secondary"
            onClick={handleClear}
            disabled={isClearing || !cacheCount}
          >
            {isClearing ? "Clearing..." : "Clear cached uploads"}
          </Button>
        </div>
      </Card>
    </div>
  )
}

function BackupSection() {
  const [isExporting, setIsExporting] = useState(false)
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

  return (
    <div className="flex flex-col gap-4">
      <Heading2>Backup</Heading2>

      <Card className="gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-semibold text-gray-900">Export your data</p>
          <p className="text-sm text-gray-700">
            Downloads your profile, documents, tags, and settings as a JSON file.
          </p>
        </div>
        <Button type="button" intent="secondary" onClick={handleExport} disabled={isExporting}>
          {isExporting ? "Exporting..." : "Export data"}
        </Button>
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
      <Heading2>Danger zone</Heading2>

      <Card className="gap-4 border-red-200">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-semibold text-gray-900">Delete all data</p>
          <p className="text-sm text-gray-700">
            Permanently removes your profile, documents, tags, and settings from this browser.
            Export a backup first: this cannot be undone.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => deleteModal.open(undefined)}
          className="bg-red-700 enabled:hover:bg-red-800 focus:ring-red-500"
        >
          Delete all data
        </Button>
      </Card>
    </div>
  )
}
