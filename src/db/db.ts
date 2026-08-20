import Dexie, { type Table } from 'dexie'
import type { Link, ResumeSection } from './types'

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
}

export class DossierDatabase extends Dexie {
  profiles!: Table<Profile, number>
  resumes!: Table<Resume, string>

  constructor() {
    super('DossierDatabase')

    this.version(1).stores({
      profiles: '++id',
      resumes: 'id, updatedAt',
    })
  }
}

export const db = new DossierDatabase()
