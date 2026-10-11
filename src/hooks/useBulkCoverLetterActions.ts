import { useCallback, useState } from "react"
import { downloadJson, getExportFilenameWithSettings } from "@/lib/download"
import { exportCoverLettersAsZip, toCoverLetterExportPayload } from "@/lib/coverLetterExport"
import { replaceExtension } from "@/lib/filenames"
import { useToast } from "@/components/toast"
import { useSettings } from "@/hooks/useSettings"
import type { CoverLetter } from "@/db/db"

interface UseBulkCoverLetterActionsResult {
  exportSelected: (letters: CoverLetter[]) => Promise<void>
  isExporting: boolean
}

export function useBulkCoverLetterActions(): UseBulkCoverLetterActionsResult {
  const [isExporting, setIsExporting] = useState(false)
  const toast = useToast()
  const { settings } = useSettings()

  const nameLetter = useCallback(
    (letter: CoverLetter) => getExportFilenameWithSettings("cover-letter", letter.title, settings),
    [settings],
  )

  const exportSelected = useCallback(
    async (letters: CoverLetter[]) => {
      if (letters.length === 0) {
        return
      }

      setIsExporting(true)
      try {
        if (letters.length === 1) {
          const letter = letters[0]
          const filename = nameLetter(letter)
          downloadJson(filename, toCoverLetterExportPayload(letter))
          toast.success("Cover letter exported", `Saved ${filename}.`)
        } else {
          await exportCoverLettersAsZip(
            replaceExtension(
              getExportFilenameWithSettings("cover-letter", "bulk", settings),
              ".zip",
            ),
            letters,
            nameLetter,
          )
          toast.success("Cover letters exported", `${letters.length} cover letters saved as ZIP.`)
        }
      } catch {
        toast.error("Could not export cover letters", "Please try again.")
      } finally {
        setIsExporting(false)
      }
    },
    [nameLetter, settings, toast],
  )

  return {
    exportSelected,
    isExporting,
  }
}
