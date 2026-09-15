import { useCallback, useEffect, useRef, useState } from "react"
import type { CoverLetter } from "@/db/db"
import { ApiError } from "@/lib/api"
import { downloadBlob } from "@/lib/download"
import {
  ensureProcessedCoverLetter,
  getProcessedCoverLetterFilename,
} from "@/lib/processedCoverLetter"

export type ProcessedCoverLetterStatus = "loading" | "ready" | "error"

export interface UseProcessedCoverLetterResult {
  status: ProcessedCoverLetterStatus
  url: string | undefined
  processedAt: Date | undefined
  error: ApiError | undefined
  isDownloading: boolean
  download: () => Promise<void>
}

export function useProcessedCoverLetter(letter: CoverLetter): UseProcessedCoverLetterResult {
  const { id: letterId, updatedAt: letterUpdatedAt, title: letterTitle } = letter

  const [status, setStatus] = useState<ProcessedCoverLetterStatus>("loading")
  const [url, setUrl] = useState<string | undefined>(undefined)
  const [processedAt, setProcessedAt] = useState<Date | undefined>(undefined)
  const [error, setError] = useState<ApiError | undefined>(undefined)
  const [isDownloading, setIsDownloading] = useState(false)

  const blobRef = useRef<Blob | undefined>(undefined)
  const urlRef = useRef<string | undefined>(undefined)
  const inFlightRef = useRef<Promise<void> | undefined>(undefined)
  const letterRef = useRef(letter)

  useEffect(() => {
    return () => {
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current)
      }
    }
  }, [])

  const load = useCallback<() => Promise<void> | undefined>(() => {
    if (inFlightRef.current) {
      return inFlightRef.current
    }

    async function fetch(): Promise<void> {
      let isStale = false
      try {
        setError(undefined)

        const requested = letterRef.current
        const { blob, processedAt } = await ensureProcessedCoverLetter(requested)

        // The active letter changed while the PDF was generating (e.g. an
        // edit landed mid-flight): discard the stale result and refetch.
        const current = letterRef.current
        isStale =
          current.id !== requested.id ||
          current.updatedAt.getTime() !== requested.updatedAt.getTime()

        if (!isStale) {
          if (urlRef.current) {
            URL.revokeObjectURL(urlRef.current)
          }

          blobRef.current = blob
          urlRef.current = URL.createObjectURL(blob)
          setUrl(urlRef.current)
          setProcessedAt(processedAt)
          setStatus("ready")
        }
      } catch (cause) {
        setStatus("error")
        setError(
          cause instanceof ApiError
            ? cause
            : new ApiError(
                "NETWORK_ERROR",
                "Something went wrong while preparing the cover letter.",
                [],
              ),
        )
      }

      inFlightRef.current = undefined
      if (isStale) {
        return fetch()
      }
    }

    const promise = fetch()
    inFlightRef.current = promise
    return promise
  }, [])

  useEffect(() => {
    letterRef.current = letter
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load, letterId, letterUpdatedAt])

  const download = useCallback(async () => {
    setIsDownloading(true)
    try {
      await load()

      if (!blobRef.current) {
        throw new ApiError("INTERNAL_ERROR", "The processed cover letter is not available yet.", [])
      }

      downloadBlob(getProcessedCoverLetterFilename(letterTitle), blobRef.current)
    } finally {
      setIsDownloading(false)
    }
  }, [load, letterTitle])

  return {
    status,
    url,
    processedAt,
    error,
    isDownloading,
    download,
  }
}
