import { useCallback, useRef, useState } from 'react'
import { parseResumeJsonFile } from './parseResumeJsonFile'
import type { Resume } from '@/db/db'

interface UseJsonUploaderReturn {
  isDragActive: boolean
  selectedFile: File | null
  isParsing: boolean
  parseError: string | null
  onDragEnter: (event: React.DragEvent<HTMLDivElement>) => void
  onDragLeave: (event: React.DragEvent<HTMLDivElement>) => void
  onDragOver: (event: React.DragEvent<HTMLDivElement>) => void
  onDrop: (event: React.DragEvent<HTMLDivElement>) => void
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void
  clearSelection: () => void
  parseAndUpload: (file: File) => Promise<ParsedResumeResult | null>
}

interface ParsedResumeResult {
  resume: Resume
  resumeId: string
}

export function useJsonUploader(): UseJsonUploaderReturn {
  const [isDragActive, setIsDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isParsing, setIsParsing] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)

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

  const onDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragActive(false)
    dropZoneRef.current = null

    const droppedFiles = event.dataTransfer.files
    if (droppedFiles.length > 0) {
      const file = droppedFiles[0]
      if (file.type === 'application/json' || file.name.endsWith('.json')) {
        setSelectedFile(file)
      }
    }
  }, [])

  const onFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files
      if (files && files.length > 0) {
        const file = files[0]
        if (file.type === 'application/json' || file.name.endsWith('.json')) {
          setSelectedFile(file)
        }
      }
      event.target.value = ''
    },
    [],
  )

  const clearSelection = useCallback(() => {
    setSelectedFile(null)
    setParseError(null)
  }, [])

  const parseAndUpload = useCallback(
    async (file: File): Promise<ParsedResumeResult | null> => {
      setIsParsing(true)
      setParseError(null)

      try {
        const result = await parseResumeJsonFile(file)
        if (!result) {
          const errorMessage = 'Failed to parse resume file.'
          setParseError(errorMessage)
          return null
        }
        return result
      } finally {
        setIsParsing(false)
      }
    },
    [],
  )

  return {
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
    parseAndUpload,
  }
}