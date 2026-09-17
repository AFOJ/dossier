import { z } from "zod"
import { db, type CoverLetter, type Profile, type Resume } from "@/db/db"
import { getAllCoverLetters } from "@/db/coverLetter"
import { clearProcessedEntityCacheForEntities } from "@/db/entityCache"
import {
  coverLetterExportContactSchema,
  resumeSectionSchema,
  exportContactSchema,
} from "@/db/schemas"
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
  await db.transaction("rw", db.profiles, db.resumes, db.entityCache, async () => {
    await db.resumes.clear()
    await db.profiles.clear()
    await db.entityCache.clear()
  })
}

export interface ExportFile {
  version: 1
  exportedAt: string
  profile: Omit<Profile, "id">
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

  const resumes = await getAllResumes()
  const coverLetters = await getAllCoverLetters()

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    profile: profileData,
    resumes,
    coverLetters,
  }
}

export const exportFileSchema = z.object({
  version: z.literal(1),
  exportedAt: z.string(),
  profile: exportContactSchema,
  resumes: z
    .array(
      z.object({
        id: z.string().optional(),
        title: z.string(),
        sections: z.array(resumeSectionSchema),
        createdAt: z.iso.datetime(),
        updatedAt: z.iso.datetime(),
        syncProfile: z.boolean().optional(),
        // Synced resumes persist contact: null (the live profile is the
        // source of truth), so null must be accepted alongside omitted.
        contact: exportContactSchema.nullish(),
      }),
    )
    .default([]),
  coverLetters: z
    .array(
      z.object({
        id: z.string().optional(),
        title: z.string(),
        subject: z.string().nullable().optional(),
        date: z.string().nullable().optional(),
        body: z.string(),
        createdAt: z.iso.datetime(),
        updatedAt: z.iso.datetime(),
        syncProfile: z.boolean().optional(),
        // Synced cover letters persist contact: null (the live profile is the
        // source of truth), so null must be accepted alongside omitted.
        contact: coverLetterExportContactSchema.nullish(),
      }),
    )
    // Absent in exports written before cover letters were included; importing
    // an older file must still work and simply restore none.
    .default([]),
})

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

  const { profile, resumes, coverLetters } = result.data

  await db.transaction("rw", db.profiles, db.resumes, db.coverLetters, db.entityCache, async () => {
    await upsertProfile(profile)

    const restoredResumes: Resume[] = resumes.map((resume) => {
      const contact = resume.contact ?? null
      return {
        id: resume.id ?? crypto.randomUUID(),
        title: resume.title,
        sections: resume.sections,
        createdAt: new Date(resume.createdAt),
        updatedAt: new Date(resume.updatedAt),
        syncProfile: resume.syncProfile ?? (contact ? false : true),
        contact,
      }
    })

    const restoredCoverLetters: CoverLetter[] = coverLetters.map((letter) => ({
      id: letter.id ?? crypto.randomUUID(),
      title: letter.title,
      subject: letter.subject ?? null,
      date: letter.date ?? null,
      body: letter.body,
      createdAt: new Date(letter.createdAt),
      updatedAt: new Date(letter.updatedAt),
      syncProfile: letter.syncProfile ?? true,
      contact: letter.contact ?? null,
    }))

    await db.resumes.clear()
    await db.coverLetters.clear()
    // Import replaces the profile and every entity table wholesale, so all
    // processed-PDF cache entries are potentially stale (an imported entity can
    // reuse a pre-import id with an older/equal updatedAt). Clear the whole
    // cache rather than trying to enumerate which entries need eviction.
    await db.entityCache.clear()

    if (restoredResumes.length > 0) {
      await db.resumes.bulkPut(restoredResumes)
    }

    if (restoredCoverLetters.length > 0) {
      await db.coverLetters.bulkPut(restoredCoverLetters)
    }
  })
}
