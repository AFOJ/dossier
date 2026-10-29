import { useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Upload01Icon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui"
import { useToast } from "@/components/toast"
import { importProfile } from "@/db/profile"

export function RestoreFromExport({ compact = false }: Readonly<{ compact?: boolean }>) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const toast = useToast()
  const navigate = useNavigate()

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ""

    if (!file) {
      return
    }

    setIsImporting(true)
    setError(null)

    try {
      await importProfile(await file.text())
      toast.success("Data imported", "Your profile and documents have been restored.")
      navigate("/profile")
    } catch (error) {
      setError("This file is not a valid Dossier export. Please check the file and try again.")
      console.error("Failed to import data:", error)
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <div className="flex w-full flex-col items-start gap-3">
      {(!compact || error) && (
        <div>
          {!compact && (
            <>
              <p className="text-sm font-semibold text-gray-900">
                Already have a Dossier profile export?
              </p>
              <p className="mt-0.5 text-sm text-gray-500">
                Restore your profile and documents from an exported file instead of starting fresh.
              </p>
            </>
          )}
          {error && (
            <p role="alert" className="mt-2 text-sm text-red-700">
              {error}
            </p>
          )}
        </div>
      )}

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
        icon={Upload01Icon}
        aria-disabled={isImporting}
        aria-busy={isImporting}
        onClick={() => {
          if (!isImporting) inputRef.current?.click()
        }}
        className={compact ? "h-11 w-full whitespace-normal" : "shrink-0 self-start sm:self-auto"}
      >
        {isImporting
          ? "Importing..."
          : compact
            ? "Import an existing profile"
            : "Import from export file"}
      </Button>
    </div>
  )
}
