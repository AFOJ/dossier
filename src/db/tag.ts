import { db, type Tag } from "@/db/db"
import { clearProcessedEntityCacheForEntities } from "@/db/entityCache"

export interface TagInput {
  name: string
  description?: string | null
  colour: string
}

export type UpdateTagInput = Partial<TagInput>

const NAME_MAX_LENGTH = 50
const DESCRIPTION_MAX_LENGTH = 240
const HEX_COLOUR_PATTERN = /^#?(?:[0-9a-f]{3}|[0-9a-f]{6})$/i
const DARK_TAG_TEXT_COLOUR = "#1F2328"
const LIGHT_TAG_TEXT_COLOUR = "#FFFFFF"
export const DEFAULT_TAG_COLOUR = "#2563EB"

export function tagColourToCss(colour: string | null | undefined): string {
  if (typeof colour !== "string") {
    return DEFAULT_TAG_COLOUR
  }

  const normalised = colour.trim().toUpperCase()
  if (!HEX_COLOUR_PATTERN.test(normalised)) {
    return DEFAULT_TAG_COLOUR
  }
  return normalised.startsWith("#") ? normalised : `#${normalised}`
}

function channelLuminance(channel: number): number {
  const value = channel / 255
  return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
}

function tagLuminance(colour: string | null | undefined): number {
  const hex = tagColourToCss(colour).slice(1)
  const expanded = hex.length === 3 ? hex.replace(/./g, "$&$&") : hex
  const red = channelLuminance(Number.parseInt(expanded.slice(0, 2), 16))
  const green = channelLuminance(Number.parseInt(expanded.slice(2, 4), 16))
  const blue = channelLuminance(Number.parseInt(expanded.slice(4, 6), 16))
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue
}

export function tagTextColour(colour: string | null | undefined): string {
  const backgroundLuminance = tagLuminance(colour)
  const contrastWithLight = 1.05 / (backgroundLuminance + 0.05)
  const contrastWithDark =
    (backgroundLuminance + 0.05) / (tagLuminance(DARK_TAG_TEXT_COLOUR) + 0.05)
  return contrastWithDark >= contrastWithLight ? DARK_TAG_TEXT_COLOUR : LIGHT_TAG_TEXT_COLOUR
}

function invalidTagMessage(message: string): Error {
  return new Error(message)
}

export function normaliseTagName(name: string): string {
  return name.trim().toLowerCase()
}

export function normaliseTagColour(colour: string): string {
  const normalised = colour.trim().toUpperCase()
  if (!HEX_COLOUR_PATTERN.test(normalised)) {
    throw invalidTagMessage("Colour must be a valid 3- or 6-digit hex value.")
  }
  return normalised
}

export function normaliseTagDescription(description: string | null | undefined): string {
  return description?.trim() ?? ""
}

export function normaliseTagIds(tagIds: unknown): number[] {
  if (!Array.isArray(tagIds)) {
    return []
  }
  return [
    ...new Set(
      tagIds.filter(
        (id): id is number => typeof id === "number" && Number.isSafeInteger(id) && id > 0,
      ),
    ),
  ]
}

function normaliseTagInput(input: TagInput) {
  const name = input.name.trim()
  const description = normaliseTagDescription(input.description)
  const colour = normaliseTagColour(input.colour)

  if (name.length === 0 || name.length > NAME_MAX_LENGTH) {
    throw invalidTagMessage("Tag name must be between 1 and 50 characters.")
  }
  if (description.length > DESCRIPTION_MAX_LENGTH) {
    throw invalidTagMessage("Tag description must be 240 characters or less.")
  }

  return {
    name,
    description,
    normalizedName: normaliseTagName(name),
    colour,
  }
}

export function compareTags(first: Tag, second: Tag): number {
  const nameComparison = first.normalizedName.localeCompare(second.normalizedName)
  if (nameComparison !== 0) {
    return nameComparison
  }
  return (first.id ?? 0) - (second.id ?? 0)
}

export function sortTags(tags: Tag[]): Tag[] {
  return [...tags].sort(compareTags)
}

export async function listTags(): Promise<Tag[]> {
  return sortTags(await db.tags.toArray())
}

export async function createTag(input: TagInput): Promise<number> {
  const normalised = normaliseTagInput(input)
  const now = new Date()

  return db.transaction("rw", db.tags, async () => {
    const existing = await db.tags.where("normalizedName").equals(normalised.normalizedName).first()
    if (existing) {
      throw invalidTagMessage("A tag with this name already exists.")
    }

    const lastTag = await db.tags.orderBy("id").last()
    const id = (lastTag?.id ?? 0) + 1
    return db.tags.add({
      ...normalised,
      id,
      createdAt: now,
      updatedAt: now,
    })
  })
}

export async function updateTag(id: number, changes: UpdateTagInput): Promise<void> {
  const existing = await db.tags.get(id)
  if (!existing) {
    throw invalidTagMessage("Tag not found.")
  }

  const normalised = normaliseTagInput({
    name: changes.name ?? existing.name,
    description: changes.description === undefined ? existing.description : changes.description,
    colour: changes.colour ?? existing.colour,
  })

  if (normalised.normalizedName !== existing.normalizedName) {
    const duplicate = await db.tags
      .where("normalizedName")
      .equals(normalised.normalizedName)
      .first()
    if (duplicate) {
      throw invalidTagMessage("A tag with this name already exists.")
    }
  }

  await db.tags.update(id, {
    name: normalised.name,
    description: normalised.description,
    normalizedName: normalised.normalizedName,
    colour: normalised.colour,
    updatedAt: new Date(),
  })
}

export async function deleteTag(id: number): Promise<void> {
  await db.transaction("rw", db.tags, db.resumes, db.coverLetters, db.entityCache, async () => {
    const tag = await db.tags.get(id)
    if (!tag) {
      throw invalidTagMessage("Tag not found.")
    }

    const now = new Date()
    const affectedResumes = await db.resumes
      .filter((resume) => normaliseTagIds(resume.tagIds).includes(id))
      .toArray()
    const affectedLetters = await db.coverLetters
      .filter((coverLetter) => normaliseTagIds(coverLetter.tagIds).includes(id))
      .toArray()

    await db.tags.delete(id)

    for (const resume of affectedResumes) {
      if (!resume.id) continue
      await db.resumes.update(resume.id, {
        tagIds: normaliseTagIds(resume.tagIds).filter((tagId) => tagId !== id),
        updatedAt: now,
      })
    }

    for (const coverLetter of affectedLetters) {
      if (!coverLetter.id) continue
      await db.coverLetters.update(coverLetter.id, {
        tagIds: normaliseTagIds(coverLetter.tagIds).filter((tagId) => tagId !== id),
        updatedAt: now,
      })
    }

    await clearProcessedEntityCacheForEntities({
      entityType: "resume",
      entityIds: affectedResumes.flatMap((resume) => (resume.id ? [resume.id] : [])),
    })
    await clearProcessedEntityCacheForEntities({
      entityType: "coverLetter",
      entityIds: affectedLetters.flatMap((coverLetter) => (coverLetter.id ? [coverLetter.id] : [])),
    })
  })
}
