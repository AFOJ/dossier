import { Button, Heading3, Subheading } from '@/components/ui'
import { cn } from '@/utils'
import { IsometricFileOpen } from '@/components/illustrations'
import { useUploadResume } from './hooks/useUploadResume'
import type { Resume } from '@/db/db'

interface UploadResumeJsonProps {
  onParsed: (resume: Resume, resumeId: string) => Promise<void> | void
}

export function UploadResumeJson(props: Readonly<UploadResumeJsonProps>) {
  const { onParsed } = props

  const {
    isDragActive,
    selectedFile,
    isParsing,
    parseError,
    onDragEnter,
    onDragLeave,
    onDragOver,
    onDrop,
    onFileSelect,
    clearSelection,
    handleUpload,
    openFileDialog,
    fileInputRef,
  } = useUploadResume({ onParsed })

  return (
    <div className="relative">
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        id="json-file-upload"
        className="sr-only"
        onChange={onFileSelect}
        disabled={isParsing}
        tabIndex={-1}
      />
      <div
        className={cn(
          'relative flex flex-col items-center justify-center',
          'rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center',
          isDragActive && 'border-primary-500 bg-primary-50',
        )}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
        role="region"
        aria-label="Upload JSON resume file"
      >
        <IsometricFileOpen aria-hidden="true" />
        {isParsing ? (
          <div
            className="mt-4 flex flex-col items-center gap-3"
            role="status"
            aria-live="polite"
          >
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent" />
            <p className="text-center text-gray-600">Validating resume...</p>
          </div>
        ) : selectedFile ? (
          <>
            <Heading3 className="mt-4">Replace resume file</Heading3>
            <Subheading className="mt-1">Drag and drop a new JSON file to replace the current selection.</Subheading>
            <div className="w-full max-w-md mt-6">
              <p className="text-center font-medium text-gray-900 mb-2">
                {selectedFile.name}
              </p>
              <p className="text-center text-sm text-gray-500 mb-4">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
              {parseError && (
                <p
                  className="text-center text-sm text-red-600 mb-4"
                  role="alert"
                >
                  {parseError}
                </p>
              )}
              <div className="flex justify-center gap-3">
                <Button
                  intent="secondary"
                  onClick={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                    clearSelection()
                  }}
                  disabled={isParsing}
                >
                  <span>Remove</span>
                </Button>
                <Button
                  intent="primary"
                  onClick={handleUpload}
                  disabled={isParsing}
                >
                  Upload
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            <Heading3 className="mt-4">Upload Resume</Heading3>
            <Subheading className="mt-1">Import an existing resume from a JSON file.</Subheading>
            <Button
              intent="primary"
              type="button"
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
                openFileDialog()
              }}
              className="mt-4"
              disabled={isParsing}
            >
              Browse files
            </Button>
            <p className="mt-2 text-center text-sm text-gray-400">
              This only accepts JSON files
            </p>
          </>
        )}
      </div>
    </div>
  )
}
