import { db, type Profile } from '@/db/db'

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
