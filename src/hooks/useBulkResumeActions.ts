import { useCallback, useState } from "react"
import { exportResumesAsZip } from "@/lib/zipExport"
import { downloadJson, getExportFilename } from "@/lib/download"
import { toResumeExportPayload } from "@/lib/resumeExport"
import { useToast } from "@/components/toast"
import type { Resume } from "@/db/db"

interface UseBulkResumeActionsResult {
  exportSelected: (resumes: Resume[]) => Promise<void>
  isExporting: boolean
}

export function useBulkResumeActions(): UseBulkResumeActionsResult {
  const [isExporting, setIsExporting] = useState(false)
  const toast = useToast()

  const exportSelected = useCallback(
    async (resumes: Resume[]) => {
      if (resumes.length === 0) {
        return
      }

      setIsExporting(true)
      try {
        if (resumes.length === 1) {
          const resume = resumes[0]
          const filename = getExportFilename("resume", new Date(), resume.title)
          downloadJson(filename, toResumeExportPayload(resume))
          toast.success("Resume exported", `Saved ${filename}.`)
        } else {
          await exportResumesAsZip(resumes)
          toast.success("Resumes exported", `${resumes.length} resumes saved as ZIP.`)
        }
      } catch {
        toast.error("Could not export resumes", "Please try again.")
      } finally {
        setIsExporting(false)
      }
    },
    [toast],
  )

  return {
    exportSelected,
    isExporting,
  }
}
