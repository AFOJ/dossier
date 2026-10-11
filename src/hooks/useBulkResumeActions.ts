import { useCallback, useState } from "react"
import { downloadJson, getExportFilenameWithSettings } from "@/lib/download"
import { exportResumesAsZip, toResumeExportPayload } from "@/lib/resumeExport"
import { replaceExtension } from "@/lib/filenames"
import { useToast } from "@/components/toast"
import { useSettings } from "@/hooks/useSettings"
import type { Resume } from "@/db/db"

interface UseBulkResumeActionsResult {
  exportSelected: (resumes: Resume[]) => Promise<void>
  isExporting: boolean
}

export function useBulkResumeActions(): UseBulkResumeActionsResult {
  const [isExporting, setIsExporting] = useState(false)
  const toast = useToast()
  const { settings } = useSettings()

  const nameResume = useCallback(
    (resume: Resume) => getExportFilenameWithSettings("resume", resume.title, settings),
    [settings],
  )

  const exportSelected = useCallback(
    async (resumes: Resume[]) => {
      if (resumes.length === 0) {
        return
      }

      setIsExporting(true)
      try {
        if (resumes.length === 1) {
          const resume = resumes[0]
          const filename = nameResume(resume)
          downloadJson(filename, toResumeExportPayload(resume))
          toast.success("Resume exported", `Saved ${filename}.`)
        } else {
          await exportResumesAsZip(
            replaceExtension(getExportFilenameWithSettings("resume", "bulk", settings), ".zip"),
            resumes,
            nameResume,
          )
          toast.success("Resumes exported", `${resumes.length} resumes saved as ZIP.`)
        }
      } catch {
        toast.error("Could not export resumes", "Please try again.")
      } finally {
        setIsExporting(false)
      }
    },
    [nameResume, settings, toast],
  )

  return {
    exportSelected,
    isExporting,
  }
}
