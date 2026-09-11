import { extractResumeJsonFiles } from "@/lib/zipImport"
import { parseResumeJsonText } from "./parseResumeJsonFile"
import { useCallback, useRef, useState } from "react"
import { useToast } from "@/components/toast"
import type { Resume } from "@/db/db"

export type StagedFileStatus = "parsing" | "valid" | "invalid"

export interface StagedFile {
  key: string
  name: string
  size: number
  status: StagedFileStatus
  error?: string
  resume?: Resume
  resumeId?: string
}

export interface BatchParsedItem {
  resume: Resume
  resumeId: string
  sourceName: string
}

interface UseUploadResumeOptions {
  onBatchParsed: (items: BatchParsedItem[]) => Promise<void> | void
}

interface UseUploadResumeReturn {
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

export function useUploadResume({
  onBatchParsed,
}: Readonly<UseUploadResumeOptions>): UseUploadResumeReturn {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const toast = useToast()

  const [isDragActive, setIsDragActive] = useState(false)
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([])
  const [pendingCount, setPendingCount] = useState(0)

  const dropZoneRef = useRef<HTMLDivElement | null>(null)

  const updateStagedFile = useCallback((key: string, changes: Partial<StagedFile>) => {
    setStagedFiles((previous) =>
      previous.map((staged) => (staged.key === key ? { ...staged, ...changes } : staged)),
    )
  }, [])

  const parseJsonText = useCallback(
    (key: string, name: string, text: string) => {
      const result = parseResumeJsonText(text, name)
      if (result.success) {
        updateStagedFile(key, {
          status: "valid",
          resume: result.resume,
          resumeId: result.resumeId,
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
    async (file: File) => {
      setPendingCount((count) => count + 1)
      try {
        const { entries, skipped } = await extractResumeJsonFiles(file)
        for (const skippedEntry of skipped) {
          const key = crypto.randomUUID()
          setStagedFiles((previous) => [
            ...previous,
            {
              key,
              name: `${file.name} / ${skippedEntry.name}`,
              size: 0,
              status: "invalid",
              error: skippedEntry.reason,
            },
          ])
        }
        for (const entry of entries) {
          const key = crypto.randomUUID()
          setStagedFiles((previous) => [
            ...previous,
            { key, name: `${file.name} / ${entry.name}`, size: 0, status: "parsing" },
          ])
          parseJsonText(key, entry.name, entry.text)
        }
      } catch (error) {
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
      } finally {
        setPendingCount((count) => count - 1)
      }
    },
    [parseJsonText],
  )

  const addFiles = useCallback(
    async (files: File[]) => {
      const room = Math.max(0, MAX_STAGED_FILES - stagedFiles.length)
      const accepted = files.slice(0, room)
      const rejectedCount = files.length - accepted.length
      if (rejectedCount > 0) {
        toast.error(
          "Too many files",
          `Only the first ${MAX_STAGED_FILES} files were added (${rejectedCount} skipped).`,
        )
      }
      for (const file of accepted) {
        if (isZipFile(file)) {
          await stageZipFile(file)
        } else if (isJsonFile(file)) {
          await stageJsonFile(file)
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
        }
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
      if (staged.status === "valid" && staged.resume && staged.resumeId) {
        items.push({ resume: staged.resume, resumeId: staged.resumeId, sourceName: staged.name })
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
