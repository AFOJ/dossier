import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button, Heading3 } from "@/components/ui"
import { useToast } from "@/components/toast"
import type { ModalContentProps } from "@/components/modal"
import { deleteProfile } from "@/db/profile"

export function DeleteAllDataDialog({ close }: Readonly<ModalContentProps<undefined>>) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const toast = useToast()
  const navigate = useNavigate()

  const handleDelete = async () => {
    setIsDeleting(true)
    setError(null)

    try {
      await deleteProfile()
      toast.success("All data deleted", "Your profile and documents were removed.")
      close()
      navigate("/setup")
    } catch (error) {
      setError("Unable to delete your data. Please try again.")
      toast.error("Failed to delete data", "Please try again.")
      setIsDeleting(false)
      console.error("Failed to delete profile:", error)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <Heading3>Delete all data?</Heading3>
        <p className="text-sm leading-6 text-gray-600">
          This will permanently delete{" "}
          <span className="font-medium text-gray-900">your profile and all of your documents</span>.
          If you want to keep your data for use in another browser or share it with someone, export
          it first. This action cannot be undone.
        </p>
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" intent="secondary" onClick={close} disabled={isDeleting} autoFocus>
          Cancel
        </Button>
        <Button
          type="button"
          onClick={handleDelete}
          disabled={isDeleting}
          className="bg-red-700 enabled:hover:bg-red-800 focus:ring-red-500"
        >
          {isDeleting ? "Deleting..." : "Delete all data"}
        </Button>
      </div>
    </div>
  )
}
