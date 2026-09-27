import { useState } from "react"
import type { ModalContentProps } from "@/components/modal"
import { Button, Heading3 } from "@/components/ui"
import { useToast } from "@/components/toast"
import type { Tag } from "@/db/db"
import { deleteTag } from "@/db/tag"

export function DeleteTagDialog({ data, close }: Readonly<ModalContentProps<Tag>>) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const toast = useToast()

  const handleDelete = async () => {
    if (data.id === undefined) {
      close()
      return
    }

    setIsDeleting(true)
    setError(null)

    try {
      await deleteTag(data.id)
      toast.success("Tag deleted", `“${data.name}” has been deleted.`)
      close()
    } catch {
      setError("Failed to delete tag. Please try again.")
      toast.error("Failed to delete tag", "Please try again.")
      setIsDeleting(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <Heading3>Delete tag?</Heading3>
        <p className="text-sm leading-6 text-gray-600">
          Are you sure you want to delete ‘{data.name}’? This will also remove it from every
          document it is associated with. This action cannot be undone.
        </p>
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="flex flex-wrap justify-end gap-2">
        <Button intent="secondary" onClick={close} disabled={isDeleting} autoFocus>
          Cancel
        </Button>
        <Button
          onClick={handleDelete}
          disabled={isDeleting}
          className="bg-red-700 enabled:hover:bg-red-800 focus:ring-red-500"
        >
          {isDeleting ? "Deleting..." : "Delete tag"}
        </Button>
      </div>
    </div>
  )
}
