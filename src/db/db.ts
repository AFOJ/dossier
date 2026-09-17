import Dexie, { type Table } from "dexie"
import type { Link, ResumeSection } from "@/db/types"

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
  contact?: Omit<Profile, "id"> | null
}

export interface CoverLetterContact {
  full_name: string
  role: string | null
  email: string | null
  phone: string | null
  location: string | null
}

export type CacheEntityType = "resume" | "coverLetter"

export interface EntityCacheEntry {
  id: string
  entityType: CacheEntityType
  entityId: string
  data: ArrayBuffer
  contentType: string
  processedAt: Date
  expiresAt: Date
}

export interface CoverLetter {
  id?: string
  title: string
  subject?: string | null
  date?: string | null
  body: string
  createdAt: Date
  updatedAt: Date
  syncProfile?: boolean
  contact?: CoverLetterContact | null
}

export class DossierDatabase extends Dexie {
  profiles!: Table<Profile, number>
  resumes!: Table<Resume, string>
  coverLetters!: Table<CoverLetter, string>
  entityCache!: Table<EntityCacheEntry, string>

  constructor() {
    super("DossierDatabase")

    this.version(1).stores({
      profiles: "++id",
      resumes: "id, updatedAt",
    })

    this.version(2).stores({
      resumeCache: "resumeId",
    })

    this.version(3).stores({
      coverLetters: "id, updatedAt",
    })

    this.version(4).stores({
      coverLetterCache: "coverLetterId",
    })

    this.version(5).stores({
      resumeCache: null,
      coverLetterCache: null,
      entityCache: "id, entityType, entityId",
    })
  }
}

export const db = new DossierDatabase()
