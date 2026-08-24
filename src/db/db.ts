import Dexie, { type Table } from 'dexie'
import type { Link, ResumeSection } from '@/db/types'

// --- SCHEMA ---
export interface Profile {
  id?: number
  full_name: string
  role: string | null
  email: string | null
  phone: string | null
  location: string | null
  links: Link[]
}

export interface Resume {
  id?: string
  title: string
  sections: ResumeSection[]
  createdAt: Date
  updatedAt: Date
  syncProfile?: boolean
  contact?: Omit<Profile, 'id'> | null
}

export interface ResumeCacheEntry {
  resumeId: string
  data: ArrayBuffer
  contentType: string
  processedAt: Date
  expiresAt: Date
}

export class DossierDatabase extends Dexie {
  profiles!: Table<Profile, number>
  resumes!: Table<Resume, string>
  resumeCache!: Table<ResumeCacheEntry, string>

  constructor() {
    super('DossierDatabase')

    this.version(1).stores({
      profiles: '++id',
      resumes: 'id, updatedAt',
    })

    this.version(2).stores({
      profiles: '++id',
      resumes: 'id, updatedAt',
      resumeCache: 'resumeId',
    })
  }
}

export const db = new DossierDatabase()
