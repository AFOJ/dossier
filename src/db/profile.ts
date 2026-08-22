import { z } from 'zod'
import { db, type Profile, type Resume } from '@/db/db'
import { resumeSectionSchema } from '@/db/schemas'
import { getAllResumes } from '@/db/resume'

export async function upsertProfile(
  data: Omit<Profile, 'id'>,
): Promise<number> {
  const existing = await db.profiles.toCollection().first()
  if (existing) {
    await db.profiles.update(existing.id!, data)
    return existing.id!
  }
  return db.profiles.add(data)
}

export async function getProfile(): Promise<Profile | null> {
  const profile = await db.profiles.toCollection().first()
  return profile ?? null
}

export async function deleteProfile(): Promise<void> {
  await db.transaction('rw', db.profiles, db.resumes, async () => {
    await db.resumes.clear()
    await db.profiles.clear()
  })
}

export interface ExportFile {
  version: 1
  exportedAt: string
  profile: Omit<Profile, 'id'>
  resumes: Resume[]
}

export async function exportProfile(): Promise<ExportFile> {
  const profile = await getProfile()

  if (!profile) {
    throw new Error('No profile found to export.')
  }

  const profileData: Omit<Profile, 'id'> = {
    full_name: profile.full_name,
    role: profile.role,
    email: profile.email,
    phone: profile.phone,
    location: profile.location,
    links: profile.links,
  }

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    profile: profileData,
    resumes: await getAllResumes(),
  }
}

const linkSchema = z.object({
  label: z.string(),
  url: z.url(),
})

export const exportFileSchema = z.object({
  version: z.literal(1),
  exportedAt: z.string(),
  profile: z.object({
    full_name: z.string().min(1),
    role: z.string().nullable(),
    email: z.string().nullable(),
    phone: z.string().nullable(),
    location: z.string().nullable(),
    links: z.array(linkSchema),
  }),
  resumes: z
    .array(
      z.object({
        id: z.string().optional(),
        title: z.string(),
        sections: z.array(resumeSectionSchema),
        createdAt: z.iso.datetime(),
        updatedAt: z.iso.datetime(),
      }),
    )
    .default([]),
})

export class InvalidExportFileError extends Error {
  constructor() {
    super('This file is not a valid Dossier export.')
    this.name = 'InvalidExportFileError'
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

  const { profile, resumes } = result.data

  await db.transaction('rw', db.profiles, db.resumes, async () => {
    await upsertProfile(profile)

    const restoredResumes: Resume[] = resumes.map((resume) => ({
      id: resume.id ?? crypto.randomUUID(),
      title: resume.title,
      sections: resume.sections,
      createdAt: new Date(resume.createdAt),
      updatedAt: new Date(resume.updatedAt),
    }))

    await db.resumes.clear()

    if (restoredResumes.length > 0) {
      await db.resumes.bulkPut(restoredResumes)
    }
  })
}
