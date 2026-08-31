import { Button, Heading3 } from '@/components/ui'
import type { ModalContentProps } from '@/components/modal'
import type { Resume } from '@/db/db'
import { getErrorFeedback } from '@/lib/api'
import { useProcessedResume } from '@/pages/resumes/list/hooks/useProcessedResume'

export function ResumePreviewDialog({
  data: resume,
  close,
}: Readonly<ModalContentProps<Resume>>) {
  const processed = useProcessedResume(resume)

  const handleDownload = () => {
    void processed.download().catch(() => {})
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <Heading3 className="truncate">{resume.title}</Heading3>
      </div>

      <div className="relative h-[70vh] w-full overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
        {processed.status === 'ready' && processed.url && (
          <iframe
            src={processed.url}
            title={`${resume.title} preview`}
            className="absolute inset-0 size-full"
          />
        )}

        {processed.status === 'loading' && (
          <div className="absolute inset-0 grid place-items-center">
            <div className="flex flex-col items-center gap-3">
              <div className="size-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
              <p className="text-sm text-gray-600">Preparing preview...</p>
            </div>
          </div>
        )}

        {processed.status === 'error' && processed.error && (
          <div className="absolute inset-0 grid place-items-center p-6">
            <div className="flex flex-col items-center gap-2 text-center">
              <p className="text-sm font-medium text-gray-800">
                {processed.error.message}
              </p>
              <ul className="flex list-disc flex-col gap-0.5 pl-4 text-left text-xs text-gray-600">
                {getErrorFeedback(processed.error).map((line) => (
                  <li key={line} className="break-all">
                    {line}
                  </li>
                ))}
              </ul>
              <Button intent="secondary" onClick={handleDownload}>
                Try again
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap justify-end gap-2">
        <Button intent="secondary" onClick={close} autoFocus>
          Close
        </Button>
        <Button
          onClick={handleDownload}
          disabled={processed.isDownloading || processed.status !== 'ready'}
        >
          {processed.isDownloading ? 'Downloading...' : 'Download PDF'}
        </Button>
      </div>
    </div>
  )
}
