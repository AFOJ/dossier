import { z } from "zod"
import { db, type CoverLetter, type Profile, type Resume, type Tag } from "@/db/db"
import { getAllCoverLetters } from "@/db/coverLetter"
import { clearProcessedEntityCacheForEntities } from "@/db/entityCache"
import {
  coverLetterExportContactSchema,
  resumeSectionSchema,
  exportContactSchema,
  tagIdsSchema,
  tagSchema,
} from "@/db/schemas"
import { listTags, normaliseTagColour, normaliseTagDescription, normaliseTagName } from "@/db/tag"
import { getAllResumes } from "@/db/resume"

export async function upsertProfile(data: Omit<Profile, "id">): Promise<number> {
  const existing = await db.profiles.toCollection().first()
  if (existing) {
    await db.profiles.update(existing.id!, data)
    await safelyInvalidateSyncedEntityCaches()
    return existing.id!
  }
  return db.profiles.add(data)
}

async function safelyInvalidateSyncedEntityCaches(): Promise<void> {
  try {
    await invalidateSyncedEntityCaches()
  } catch (error) {
    console.error("Failed to invalidate entity caches:", error)
  }
}

async function invalidateSyncedEntityCaches(): Promise<void> {
  const [resumes, letters] = await Promise.all([getAllResumes(), getAllCoverLetters()])
  await Promise.all([
    clearProcessedEntityCacheForEntities({
      entityType: "resume",
      entityIds: resumes
        .filter((resume) => resume.syncProfile !== false)
        .map((resume) => resume.id!),
    }),
    clearProcessedEntityCacheForEntities({
      entityType: "coverLetter",
      entityIds: letters
        .filter((letter) => letter.syncProfile !== false)
        .map((letter) => letter.id!),
    }),
  ])
}

export async function getProfile(): Promise<Profile | null> {
  const profile = await db.profiles.toCollection().first()
  return profile ?? null
}

export async function deleteProfile(): Promise<void> {
  await db.transaction(
    "rw",
    db.profiles,
    db.tags,
    db.resumes,
    db.coverLetters,
    db.entityCache,
    async () => {
      await db.resumes.clear()
      await db.coverLetters.clear()
      await db.tags.clear()
      await db.profiles.clear()
      await db.entityCache.clear()
    },
  )
}

export interface ExportFile {
  version: 2
  exportedAt: string
  profile: Omit<Profile, "id">
  tags: Tag[]
  resumes: Resume[]
  coverLetters: CoverLetter[]
}

export async function exportProfile(): Promise<ExportFile> {
  const profile = await getProfile()

  if (!profile) {
    throw new Error("No profile found to export.")
  }

  const profileData: Omit<Profile, "id"> = {
    full_name: profile.full_name,
    role: profile.role,
    email: profile.email,
    phone: profile.phone,
    location: profile.location,
    links: profile.links,
  }

  const [tags, resumes, coverLetters] = await Promise.all([
    listTags(),
    getAllResumes(),
    getAllCoverLetters(),
  ])

  return {
    version: 2,
    exportedAt: new Date().toISOString(),
    profile: profileData,
    tags,
    resumes,
    coverLetters,
  }
}

export const exportFileSchema = z
  .object({
    version: z.literal(2),
    exportedAt: z.string(),
    profile: exportContactSchema,
    tags: z.array(tagSchema.strict()).superRefine((tags, ctx) => {
      const ids = new Set<number>()
      const normalisedNames = new Set<string>()

      tags.forEach((tag, index) => {
        if (ids.has(tag.id)) {
          ctx.addIssue({
            code: "custom",
            path: [index, "id"],
            message: "Tag IDs must be unique",
          })
        }
        ids.add(tag.id)

        const normalisedName = normaliseTagName(tag.name)
        const storedNormalisedName = tag.normalizedName.trim().toLowerCase()
        if (storedNormalisedName !== normalisedName) {
          ctx.addIssue({
            code: "custom",
            path: [index, "normalizedName"],
            message: "Normalised tag name does not match the name",
          })
        }
        if (normalisedNames.has(storedNormalisedName)) {
          ctx.addIssue({
            code: "custom",
            path: [index, "normalizedName"],
            message: "Tag names must be unique",
          })
        }
        normalisedNames.add(storedNormalisedName)
      })
    }),
    resumes: z.array(
      z
        .object({
          id: z.string().optional(),
          title: z.string(),
          sections: z.array(resumeSectionSchema),
          tagIds: tagIdsSchema,
          createdAt: z.iso.datetime(),
          updatedAt: z.iso.datetime(),
          syncProfile: z.boolean().optional(),
          contact: exportContactSchema.nullish(),
        })
        .strict(),
    ),
    coverLetters: z.array(
      z
        .object({
          id: z.string().optional(),
          title: z.string(),
          subject: z.string().nullable().optional(),
          date: z.string().nullable().optional(),
          body: z.string(),
          tagIds: tagIdsSchema,
          createdAt: z.iso.datetime(),
          updatedAt: z.iso.datetime(),
          syncProfile: z.boolean().optional(),
          contact: coverLetterExportContactSchema.nullish(),
        })
        .strict(),
    ),
  })
  .strict()

export class InvalidExportFileError extends Error {
  constructor() {
    super("This file is not a valid Dossier export.")
    this.name = "InvalidExportFileError"
  }
}

export async function importProfile(fileContent: string): Promise<void> {
  let parsedJson: unknown

  try {
    parsedJson = JSON.parse(fileContent)
  } catch {
    throw new InvalidExportFileError()
  }

  const result = exportFileSchema.safeParse(parsedJson)

  if (!result.success) {
    throw new InvalidExportFileError()
  }

  const { profile, tags, resumes, coverLetters } = result.data
  const knownTagIds = new Set(tags.map((tag) => tag.id))

  const restoredTags: Tag[] = tags.map((tag) => ({
    id: tag.id,
    name: tag.name.trim(),
    description: normaliseTagDescription(tag.description ?? undefined),
    normalizedName: normaliseTagName(tag.name),
    colour: normaliseTagColour(tag.colour),
    createdAt: new Date(tag.createdAt),
    updatedAt: new Date(tag.updatedAt),
  }))

  const restoredResumes: Resume[] = resumes.map((resume) => {
    const contact = resume.contact ?? null
    return {
      id: resume.id ?? crypto.randomUUID(),
      title: resume.title,
      sections: resume.sections,
      tagIds: resume.tagIds.filter((tagId) => knownTagIds.has(tagId)),
      createdAt: new Date(resume.createdAt),
      updatedAt: new Date(resume.updatedAt),
      syncProfile: resume.syncProfile ?? (contact ? false : true),
      contact,
    }
  })

  const restoredCoverLetters: CoverLetter[] = coverLetters.map((coverLetter) => ({
    id: coverLetter.id ?? crypto.randomUUID(),
    title: coverLetter.title,
    subject: coverLetter.subject ?? null,
    date: coverLetter.date ?? null,
    body: coverLetter.body,
    tagIds: coverLetter.tagIds.filter((tagId) => knownTagIds.has(tagId)),
    createdAt: new Date(coverLetter.createdAt),
    updatedAt: new Date(coverLetter.updatedAt),
    syncProfile: coverLetter.syncProfile ?? true,
    contact: coverLetter.contact ?? null,
  }))

  await db.transaction(
    "rw",
    db.profiles,
    db.tags,
    db.resumes,
    db.coverLetters,
    db.entityCache,
    async () => {
      await db.profiles.clear()
      await db.tags.clear()
      await db.resumes.clear()
      await db.coverLetters.clear()
      await db.entityCache.clear()

      await db.profiles.add(profile)

      if (restoredTags.length > 0) {
        await db.tags.bulkPut(restoredTags)
      }
      if (restoredResumes.length > 0) {
        await db.resumes.bulkPut(restoredResumes)
      }
      if (restoredCoverLetters.length > 0) {
        await db.coverLetters.bulkPut(restoredCoverLetters)
      }
    },
  )
}
