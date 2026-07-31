import { db, type Resume } from './db'
import type { ResumeSection } from './types'

const RESUME_TABLE = db.resumes

export async function createResume(
  title: string,
  sections: ResumeSection[],
): Promise<string> {
  const id = crypto.randomUUID()
  const now = new Date()

  await RESUME_TABLE.add({
    id,
    title,
    sections,
    createdAt: now,
    updatedAt: now,
  })

  return id
}

export async function getResume(id: string): Promise<Resume | undefined> {
  return RESUME_TABLE.get(id)
}

export async function getAllResumes(): Promise<Resume[]> {
  return RESUME_TABLE.orderBy('updatedAt').reverse().toArray()
}

export async function updateResume(
  id: string,
  changes: Partial<Pick<Resume, 'title' | 'sections'>>,
): Promise<void> {
  await RESUME_TABLE.update(id, {
    ...changes,
    updatedAt: new Date(),
  })
}

export async function deleteResume(id: string): Promise<void> {
  await RESUME_TABLE.delete(id)
}
