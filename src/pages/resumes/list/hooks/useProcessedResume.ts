import { useCallback, useEffect, useRef, useState } from 'react'
import type { Resume } from '@/db/db'
import { ApiError } from '@/lib/api'
import { downloadBlob } from '@/lib/download'
import {
  ensureProcessedResume,
  getProcessedResumeFilename,
} from '@/lib/processedResume'

export type ProcessedResumeStatus = 'loading' | 'ready' | 'error'

export interface UseProcessedResumeResult {
  status: ProcessedResumeStatus
  /** Object URL of the processed PDF for the live preview. */
  url: string | undefined
  /** When the displayed PDF was rendered (cache hit or fresh). */
  processedAt: Date | undefined
  error: ApiError | undefined
  isDownloading: boolean
  download: () => Promise<void>
}

/**
 * Thin state machine around ensureProcessedResume: resolves the resume's
 * PDF on mount (cache-first), exposes a preview object URL, and offers a
 * download of the same blob. Concurrent calls share one in-flight request.
 */
export function useProcessedResume(resume: Resume): UseProcessedResumeResult {
  const resumeId = resume.id
  const resumeUpdatedAt = resume.updatedAt
  const resumeTitle = resume.title

  const [status, setStatus] = useState<ProcessedResumeStatus>('loading')
  const [url, setUrl] = useState<string | undefined>(undefined)
  const [processedAt, setProcessedAt] = useState<Date | undefined>(undefined)
  const [error, setError] = useState<ApiError | undefined>(undefined)
  const [isDownloading, setIsDownloading] = useState(false)

  const blobRef = useRef<Blob | undefined>(undefined)
  const urlRef = useRef<string | undefined>(undefined)
  const inFlightRef = useRef<Promise<void> | undefined>(undefined)

  const resumeRef = useRef(resume)

  useEffect(() => {
    return () => {
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current)
      }
    }
  }, [])

  const load = useCallback(() => {
    inFlightRef.current ??= (async () => {
      try {
        setError(undefined)

        const { blob, processedAt } = await ensureProcessedResume(
          resumeRef.current,
        )

        if (urlRef.current) {
          URL.revokeObjectURL(urlRef.current)
        }

        blobRef.current = blob
        urlRef.current = URL.createObjectURL(blob)
        setUrl(urlRef.current)
        setProcessedAt(processedAt)
        setStatus('ready')
      } catch (cause) {
        setStatus('error')
        setError(
          cause instanceof ApiError
            ? cause
            : new ApiError(
                'NETWORK_ERROR',
                'Something went wrong while preparing the resume.',
                [],
              ),
        )
      } finally {
        inFlightRef.current = undefined
      }
    })()

    return inFlightRef.current
  }, [])

  // Re-run when the resume's meaningful identity changes (e.g. after an
  // edit bumps updatedAt) — ensureProcessedResume then sees an invalidated
  // cache entry and refetches. The ref is synced here rather than on every
  // render because loads only ever happen inside this effect.
  useEffect(() => {
    resumeRef.current = resume
    void load()
    // `resume` is deliberately not a dependency: object identity changes on
    // every parent render, while (resumeId, resumeUpdatedAt) capture any
    // real content change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load, resumeId, resumeUpdatedAt])

  const download = useCallback(async () => {
    setIsDownloading(true)
    try {
      await load()

      if (!blobRef.current) {
        throw new ApiError(
          'INTERNAL_ERROR',
          'The processed resume is not available yet.',
          [],
        )
      }

      downloadBlob(getProcessedResumeFilename(resumeTitle), blobRef.current)
    } finally {
      setIsDownloading(false)
    }
  }, [load, resumeTitle])

  return {
    status,
    url,
    processedAt,
    error,
    isDownloading,
    download,
  }
}
