import { useCallback, useState } from "react"
import { exportCoverLettersAsZip, toCoverLetterExportPayload } from "@/lib/coverLetterExport"
import { downloadJson, getExportFilename } from "@/lib/download"
import { useToast } from "@/components/toast"
import { slugify } from "@/utils"
import type { CoverLetter } from "@/db/db"

interface UseBulkCoverLetterActionsResult {
  exportSelected: (letters: CoverLetter[]) => Promise<void>
  isExporting: boolean
}

export function useBulkCoverLetterActions(): UseBulkCoverLetterActionsResult {
  const [isExporting, setIsExporting] = useState(false)
  const toast = useToast()

  const exportSelected = useCallback(
    async (letters: CoverLetter[]) => {
      if (letters.length === 0) {
        return
      }

      setIsExporting(true)
      try {
        if (letters.length === 1) {
          const letter = letters[0]
          const filename = getExportFilename("cover-letter", new Date(), slugify(letter.title))
          downloadJson(filename, toCoverLetterExportPayload(letter))
          toast.success("Cover letter exported", `Saved ${filename}.`)
        } else {
          await exportCoverLettersAsZip(letters)
          toast.success("Cover letters exported", `${letters.length} cover letters saved as ZIP.`)
        }
      } catch {
        toast.error("Could not export cover letters", "Please try again.")
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
