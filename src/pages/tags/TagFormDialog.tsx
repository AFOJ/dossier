import { useMemo, useState } from "react"
import type { ModalContentProps } from "@/components/modal"
import { Button, Field, Heading3, Input, Textarea } from "@/components/ui"
import { useToast } from "@/components/toast"
import type { Tag } from "@/db/db"
import {
  createTag,
  DEFAULT_TAG_COLOUR,
  normaliseTagColour,
  normaliseTagDescription,
  tagColourToCss,
  tagTextColour,
  updateTag,
} from "@/db/tag"
import { cn } from "@/utils"

export type TagFormDialogData = {
  tag?: Tag
}

const DEFAULT_COLOUR = DEFAULT_TAG_COLOUR
const PRESET_COLOURS = [
  "#B60205",
  "#D93F0B",
  "#FBCA04",
  "#0E8A16",
  "#006B75",
  "#1D76DB",
  "#0052CC",
  "#5319E7",
  "#E99695",
  "#F9D0C4",
  "#FEF2C0",
  "#C2E0C6",
  "#BFDADC",
  "#C5DEF5",
  "#BFD4F2",
  "#D4C5F9",
]

function colourForPreview(colour: string): string {
  return tagColourToCss(colour)
}

function normalisedForComparison(value: string, normalise: (value: string) => string): string {
  try {
    return normalise(value)
  } catch {
    return value.trim()
  }
}

export function TagFormDialog({ data, close }: Readonly<ModalContentProps<TagFormDialogData>>) {
  const { tag } = data
  const isEditing = tag !== undefined
  const initialValues = useMemo(
    () => ({
      name: tag?.name ?? "",
      description: tag?.description ?? "",
      colour: tag?.colour ?? DEFAULT_COLOUR,
    }),
    [tag],
  )
  const [name, setName] = useState(initialValues.name)
  const [description, setDescription] = useState(initialValues.description)
  const [colour, setColour] = useState(initialValues.colour)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const toast = useToast()

  const isDirty =
    name !== initialValues.name ||
    normalisedForComparison(description, normaliseTagDescription) !== initialValues.description ||
    normalisedForComparison(colour, normaliseTagColour) !== initialValues.colour

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setIsSaving(true)

    try {
      if (isEditing && tag.id !== undefined) {
        await updateTag(tag.id, { name, description, colour })
        toast.success("Tag updated", `“${name.trim()}” has been updated.`)
      } else {
        await createTag({ name, description, colour })
        toast.success("Tag created", `“${name.trim()}” has been created.`)
      }
      close()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to save this tag.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <Heading3>{isEditing ? "Edit tag" : "Create tag"}</Heading3>

      <div className="flex h-20 items-center justify-center rounded-[10px] bg-gray-50 px-4 py-4">
        <span
          className="rounded-full px-3 py-1.5 text-xs font-semibold"
          style={{
            backgroundColor: colourForPreview(colour),
            color: tagTextColour(colour),
          }}
        >
          {name.trim() || "Tag preview"}
        </span>
      </div>

      <Field label="Name" inputId="tag-name" required>
        <Input
          id="tag-name"
          value={name}
          onValueChange={(value) => setName(value)}
          maxLength={50}
          placeholder="Tag name"
          autoFocus
        />
      </Field>

      <Field label="Description" inputId="tag-description">
        <Textarea
          id="tag-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          maxLength={240}
          rows={4}
          placeholder="Optionally add a description"
          className="min-h-24 resize-y"
        />
      </Field>

      <Field label="Colour" inputId="tag-colour" required>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span
              aria-hidden
              className="size-[42px] shrink-0 rounded-[10px] border border-gray-200"
              style={{ backgroundColor: colourForPreview(colour) }}
            />
            <Input
              id="tag-colour"
              aria-label="Hex value"
              value={colour}
              onValueChange={(value) => setColour(value)}
              className="font-mono uppercase"
              placeholder="#2563EB"
              maxLength={7}
            />
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-gray-700">Choose from default colours</p>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
              {PRESET_COLOURS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  aria-label={`Use ${preset}`}
                  className={cn(
                    "h-11 w-full rounded-[10px] border border-black/5 focus:outline-none focus:ring-2 focus:ring-gray-600",
                    colourForPreview(colour).toUpperCase() === preset.toUpperCase() &&
                      "ring-2 ring-gray-900 ring-offset-1",
                  )}
                  style={{ backgroundColor: preset }}
                  onClick={() => setColour(preset)}
                />
              ))}
            </div>
          </div>
        </div>
      </Field>

      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="flex flex-wrap justify-end gap-3">
        <Button type="button" intent="secondary" onClick={close} disabled={isSaving}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSaving || (isEditing && !isDirty)}>
          {isSaving ? "Saving..." : isEditing ? "Save Changes" : "Create Tag"}
        </Button>
      </div>
    </form>
  )
}
