import type { Resume } from "@/db/db"

export interface ResumeExportPayload {
  id: Resume["id"]
  title: string
  sections: Resume["sections"]
  createdAt: string
  updatedAt: string
  syncProfile: Resume["syncProfile"]
  contact: Resume["contact"]
}

/**
 * Builds the versioned JSON payload used for resume exports.
 * Shared by single JSON downloads and multi-resume ZIP exports so both
 * formats stay in sync.
 */
export function toResumeExportPayload(resume: Resume): ResumeExportPayload {
  return {
    id: resume.id,
    title: resume.title.trim(),
    sections: resume.sections,
    createdAt: resume.createdAt.toISOString(),
    updatedAt: resume.updatedAt.toISOString(),
    syncProfile: resume.syncProfile,
    contact: resume.contact,
  }
}
