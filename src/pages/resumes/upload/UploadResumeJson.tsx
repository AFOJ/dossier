import { useState } from "react"
import { Cancel01Icon } from "@hugeicons/core-free-icons"
import { Button, Heading3, Subheading } from "@/components/ui"
import { useToast } from "@/components/toast"
import { cn } from "@/utils"
import { IsometricFileOpen } from "@/components/illustrations"
import { useUploadResume } from "./hooks/useUploadResume"
import type { BatchParsedItem, StagedFile } from "./hooks/useUploadResume"

interface UploadResumeJsonProps {
  onBatchParsed: (items: BatchParsedItem[]) => Promise<void> | void
}

function StatusBadge({ staged }: Readonly<{ staged: StagedFile }>) {
  if (staged.status === "parsing") {
    return (
      <span
        className="inline-flex items-center gap-1.5 text-sm text-gray-500"
        role="status"
        aria-live="polite"
      >
        <span className="animate-spin rounded-full h-4 w-4 border-2 border-primary-500 border-t-transparent" />
        Checking…
      </span>
    )
  }
  if (staged.status === "valid") {
    return (
      <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
        Valid
      </span>
    )
  }
  return (
    <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20">
      Invalid
    </span>
  )
}

export function UploadResumeJson(props: Readonly<UploadResumeJsonProps>) {
  const { onBatchParsed } = props
  const [isImporting, setIsImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const toast = useToast()

  const {
    isDragActive,
    stagedFiles,
    validCount,
    isParsing,
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
  } = useUploadResume({ onBatchParsed })

  const busy = isParsing || isImporting

  const handleImport = async () => {
    setIsImporting(true)
    setImportError(null)
    try {
      await importValid()
    } catch {
      setImportError("Import failed. Some resumes may not have been imported. Please try again.")
      toast.error("Import failed", "Some resumes may not have been imported. Please try again.")
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,.zip"
          multiple
          id="resume-file-upload"
          className="sr-only"
          onChange={onFileSelect}
          disabled={busy}
          tabIndex={-1}
        />
        <div
          className={cn(
            "relative flex flex-col items-center justify-center",
            "rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center",
            isDragActive && "border-primary-500 bg-primary-50",
          )}
          onDragEnter={onDragEnter}
          onDragLeave={onDragLeave}
          onDragOver={onDragOver}
          onDrop={onDrop}
          role="region"
          aria-label="Upload resume files"
        >
          <IsometricFileOpen aria-hidden="true" />
          <Heading3 className="mt-4">Upload resumes</Heading3>
          <Subheading className="mt-1">
            Import existing resumes from JSON files or a ZIP export.
          </Subheading>
          <Button
            intent="primary"
            type="button"
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              openFileDialog()
            }}
            className="mt-4"
            disabled={busy}
          >
            Browse files
          </Button>
          <p className="mt-2 text-center text-sm text-gray-400">
            Accepts JSON files, multiple files, and ZIP archives
          </p>
        </div>
      </div>

      {importError && (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {importError}
        </p>
      )}

      {stagedFiles.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white">
          <ul className="divide-y divide-gray-100">
            {stagedFiles.map((staged) => (
              <li key={staged.key} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="break-words text-sm font-medium text-gray-900">{staged.name}</p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                    {staged.size > 0 && (
                      <span className="text-xs text-gray-500">
                        {(staged.size / 1024).toFixed(1)} KB
                      </span>
                    )}
                    <StatusBadge staged={staged} />
                  </div>
                  {staged.status === "invalid" && staged.error && (
                    <p className="mt-1 text-xs text-red-600" role="alert">
                      {staged.error}
                    </p>
                  )}
                </div>
                <Button
                  intent="secondary"
                  aria-label={`Remove ${staged.name}`}
                  icon={Cancel01Icon}
                  onClick={() => removeFile(staged.key)}
                  disabled={busy}
                  className="size-8 p-0"
                />
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-200 px-4 py-3">
            <p className="text-sm text-gray-600">
              {validCount} of {stagedFiles.length} valid
            </p>
            <div className="flex gap-2">
              <Button intent="secondary" onClick={clearAll} disabled={busy}>
                Clear all
              </Button>
              <Button onClick={handleImport} disabled={busy || validCount === 0}>
                {isImporting
                  ? "Importing…"
                  : `Import ${validCount} resume${validCount === 1 ? "" : "s"}`}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
