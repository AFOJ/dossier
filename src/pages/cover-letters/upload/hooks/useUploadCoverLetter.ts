import { extractResumeJsonFiles } from "@/lib/zipImport"
import { parseCoverLetterJsonText } from "./parseCoverLetterJsonFile"
import { useCallback, useRef, useState } from "react"
import { useToast } from "@/components/toast"
import type { CoverLetter } from "@/db/db"

export type StagedFileStatus = "parsing" | "valid" | "invalid"

export interface StagedFile {
  key: string
  name: string
  size: number
  status: StagedFileStatus
  error?: string
  letter?: CoverLetter
  letterId?: string
}

export interface BatchParsedItem {
  letter: CoverLetter
  letterId: string
  sourceName: string
}

interface UseUploadCoverLetterOptions {
  onBatchParsed: (items: BatchParsedItem[]) => Promise<void> | void
}

interface UseUploadCoverLetterReturn {
  isDragActive: boolean
  stagedFiles: StagedFile[]
  validCount: number
  isParsing: boolean
  onDragEnter: (event: React.DragEvent<HTMLDivElement>) => void
  onDragLeave: (event: React.DragEvent<HTMLDivElement>) => void
  onDragOver: (event: React.DragEvent<HTMLDivElement>) => void
  onDrop: (event: React.DragEvent<HTMLDivElement>) => void
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void
  removeFile: (key: string) => void
  clearAll: () => void
  importValid: () => Promise<void>
  openFileDialog: () => void
  fileInputRef: React.RefObject<HTMLInputElement | null>
}

const MAX_STAGED_FILES = 50

function isZipFile(file: File): boolean {
  const name = file.name.toLowerCase()
  return (
    name.endsWith(".zip") ||
    file.type === "application/zip" ||
    file.type === "application/x-zip-compressed"
  )
}

function isJsonFile(file: File): boolean {
  return file.type === "application/json" || file.name.toLowerCase().endsWith(".json")
}

export function useUploadCoverLetter({
  onBatchParsed,
}: Readonly<UseUploadCoverLetterOptions>): UseUploadCoverLetterReturn {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const toast = useToast()

  const [isDragActive, setIsDragActive] = useState(false)
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([])
  const [pendingCount, setPendingCount] = useState(0)

  const dropZoneRef = useRef<HTMLDivElement | null>(null)

  const updateStagedFile = useCallback((key: string, changes: Partial<StagedFile>) => {
    setStagedFiles((previous) => {
      return previous.map((staged) => {
        if (staged.key === key) {
          return { ...staged, ...changes }
        }
        return staged
      })
    })
  }, [])

  const parseJsonText = useCallback(
    (key: string, name: string, text: string) => {
      const result = parseCoverLetterJsonText(text, name)
      if (result.success) {
        updateStagedFile(key, {
          status: "valid",
          letter: result.letter,
          letterId: result.letterId,
        })
      } else {
        updateStagedFile(key, { status: "invalid", error: result.error })
      }
    },
    [updateStagedFile],
  )

  const stageJsonFile = useCallback(
    async (file: File) => {
      const key = crypto.randomUUID()
      setStagedFiles((previous) => [
        ...previous,
        { key, name: file.name, size: file.size, status: "parsing" },
      ])
      setPendingCount((count) => count + 1)
      try {
        parseJsonText(key, file.name, await file.text())
      } catch {
        updateStagedFile(key, { status: "invalid", error: "Could not read file." })
      } finally {
        setPendingCount((count) => count - 1)
      }
    },
    [parseJsonText, updateStagedFile],
  )

  const stageZipFile = useCallback(
    async (file: File, room: number): Promise<{ remaining: number; truncated: boolean }> => {
      setPendingCount((count) => count + 1)
      try {
        const { entries, skipped } = await extractResumeJsonFiles(file)
        const rows: { row: StagedFile; text?: string }[] = [
          ...skipped.map((skippedEntry) => {
            return {
              row: {
                key: crypto.randomUUID(),
                name: `${file.name} / ${skippedEntry.name}`,
                size: 0,
                status: "invalid" as const,
                error: skippedEntry.reason,
              },
            }
          }),
          ...entries.map((entry) => {
            return {
              row: {
                key: crypto.randomUUID(),
                name: `${file.name} / ${entry.name}`,
                size: 0,
                status: "parsing" as const,
              },
              text: entry.text,
            }
          }),
        ]
        const accepted = rows.slice(0, room)
        setStagedFiles((previous) => {
          return [
            ...previous,
            ...accepted.map((candidate) => {
              return candidate.row
            }),
          ]
        })
        for (const acceptedRow of accepted) {
          if (acceptedRow.text !== undefined) {
            parseJsonText(acceptedRow.row.key, acceptedRow.row.name, acceptedRow.text)
          }
        }
        return { remaining: room - accepted.length, truncated: rows.length > accepted.length }
      } catch (error) {
        if (room > 0) {
          const key = crypto.randomUUID()
          setStagedFiles((previous) => [
            ...previous,
            {
              key,
              name: file.name,
              size: file.size,
              status: "invalid",
              error: error instanceof Error ? error.message : "Could not read ZIP file.",
            },
          ])
          return { remaining: room - 1, truncated: false }
        }
        return { remaining: room, truncated: true }
      } finally {
        setPendingCount((count) => count - 1)
      }
    },
    [parseJsonText],
  )

  const addFiles = useCallback(
    async (files: File[]) => {
      let remaining = Math.max(0, MAX_STAGED_FILES - stagedFiles.length)
      let truncated = false
      for (const file of files) {
        if (remaining <= 0) {
          truncated = true
          break
        }
        if (isZipFile(file)) {
          const result = await stageZipFile(file, remaining)
          remaining = result.remaining
          truncated = truncated || result.truncated
        } else if (isJsonFile(file)) {
          await stageJsonFile(file)
          remaining -= 1
        } else {
          const key = crypto.randomUUID()
          setStagedFiles((previous) => [
            ...previous,
            {
              key,
              name: file.name,
              size: file.size,
              status: "invalid",
              error: "Unsupported file type. Only JSON and ZIP files are accepted.",
            },
          ])
          remaining -= 1
        }
      }
      if (truncated) {
        toast.error(
          "Too many files",
          `Only the first ${MAX_STAGED_FILES} files were added. Remove some to add more.`,
        )
      }
    },
    [stagedFiles.length, stageJsonFile, stageZipFile, toast],
  )

  const onDragEnter = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    dropZoneRef.current = event.currentTarget
    setIsDragActive(true)
  }, [])

  const onDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    const relatedTarget = event.relatedTarget as Node | null
    if (dropZoneRef.current && !dropZoneRef.current.contains(relatedTarget)) {
      setIsDragActive(false)
      dropZoneRef.current = null
    }
  }, [])

  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
  }, [])

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      event.stopPropagation()
      setIsDragActive(false)
      dropZoneRef.current = null
      void addFiles(Array.from(event.dataTransfer.files))
    },
    [addFiles],
  )

  const onFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files
      if (files && files.length > 0) {
        void addFiles(Array.from(files))
      }
      event.target.value = ""
    },
    [addFiles],
  )

  const removeFile = useCallback((key: string) => {
    setStagedFiles((previous) => previous.filter((staged) => staged.key !== key))
  }, [])

  const clearAll = useCallback(() => {
    setStagedFiles([])
  }, [])

  const openFileDialog = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const importValid = useCallback(async () => {
    const items: BatchParsedItem[] = []
    for (const staged of stagedFiles) {
      if (staged.status === "valid" && staged.letter && staged.letterId) {
        items.push({ letter: staged.letter, letterId: staged.letterId, sourceName: staged.name })
      }
    }
    if (items.length === 0) {
      return
    }
    await onBatchParsed(items)
  }, [stagedFiles, onBatchParsed])

  const validCount = stagedFiles.filter((staged) => staged.status === "valid").length

  return {
    isDragActive,
    stagedFiles,
    validCount,
    isParsing: pendingCount > 0,
    onDragEnter,
    onDragLeave,
    onDragOver,
    onDrop,
    onFileSelect,
    removeFile,
    clearAll,
    importValid,
    openFileDialog,
    fileInputRef,
  }
}
