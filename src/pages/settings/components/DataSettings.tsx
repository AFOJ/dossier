import { useState } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { Button, Heading2 } from "@/components/ui"
import { useModal } from "@/components/modal"
import { useToast } from "@/components/toast"
import { useSettings } from "@/hooks/useSettings"
import { db } from "@/db/db"
import { exportProfile } from "@/db/profile"
import { downloadJson, getExportFilenameWithSettings } from "@/lib/download"
import { DeleteAllDataDialog } from "@/pages/settings/components/DeleteAllDataDialog"

export function DataSection() {
  const [isExporting, setIsExporting] = useState(false)
  const [isClearing, setIsClearing] = useState(false)
  const cacheCount = useLiveQuery(() => db.entityCache.count(), [])
  const { settings } = useSettings()
  const toast = useToast()

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const data = await exportProfile()
      const filename = getExportFilenameWithSettings("profile", "backup", settings)
      downloadJson(filename, data)
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
      toast.success("Cached previews cleared", "Saved PDF previews were removed.")
    } catch (error) {
      toast.error("Failed to clear cached previews", "Please try again.")
      console.error("Failed to clear entity cache:", error)
    } finally {
      setIsClearing(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Heading2>Data</Heading2>

      <div className="divide-y divide-gray-200">
        <div
          id="export-your-data"
          className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
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

        <div className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900">Cached previews</p>
            <p className="mt-1 text-xs text-[#59636e]">
              Saved PDF previews stay in this browser. Clearing them leaves your documents intact;
              Dossier generates a new preview when you next need one.{" "}
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
            {isClearing ? "Clearing..." : "Clear cached previews"}
          </Button>
        </div>
      </div>
    </div>
  )
}

export function DangerZone() {
  const deleteModal = useModal(DeleteAllDataDialog, {
    closeOnBackdropClick: false,
    closeOnEscape: false,
  })

  return (
    <div className="flex flex-col gap-4">
      <Heading2 className="text-[#d1242f]">Danger zone</Heading2>

      <div className="border-t border-gray-200">
        <div className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900">Delete all data</p>
            <p className="mt-1 text-xs text-[#59636e]">
              Permanently removes your profile, documents, tags, and settings from this browser.{" "}
              Export a backup first: this cannot be undone.
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
      </div>
    </div>
  )
}
