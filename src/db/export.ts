import type { Profile } from '@/db/db'
import { getProfile } from '@/db/profile'
import { getAllResumes } from '@/db/resume'

export interface ExportFile {
  version: 1
  exportedAt: string
  profile: Omit<Profile, 'id'>
  resumes: Awaited<ReturnType<typeof getAllResumes>>
}

export async function buildExportData(): Promise<ExportFile> {
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
  const resumes = await getAllResumes()

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    profile: profileData,
    resumes,
  }
}
