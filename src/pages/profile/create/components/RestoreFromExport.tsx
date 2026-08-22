import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Divider } from '@/components/ui'
import { useToast } from '@/components/toast'
import { importProfile } from '@/db/profile'

export function RestoreFromExport() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const toast = useToast()
  const navigate = useNavigate()

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) {
      return
    }

    setIsImporting(true)
    setError(null)

    try {
      await importProfile(await file.text())
      toast.success(
        'Data imported',
        'Your profile and resumes have been restored.',
      )
      navigate('/profile')
    } catch (error) {
      setError(
        'This file is not a valid Dossier export. Please check the file and try again.',
      )
      console.error('Failed to import data:', error)
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <>
      <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-900">
            Already have a Dossier profile export?
          </p>
          <p className="mt-0.5 text-sm text-gray-500">
            Restore your profile and resumes from an exported file instead of
            starting fresh.
          </p>
          {error && (
            <p role="alert" className="mt-2 text-sm text-red-700">
              {error}
            </p>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="application/json,.json"
          onChange={handleFileChange}
          className="hidden"
          aria-hidden
          tabIndex={-1}
        />

        <Button
          type="button"
          intent="secondary"
          disabled={isImporting}
          onClick={() => inputRef.current?.click()}
          className="shrink-0 self-start sm:self-auto"
        >
          {isImporting ? 'Importing...' : 'Import from export file'}
        </Button>
      </div>

      <Divider className="border-gray-300" />
    </>
  )
}
