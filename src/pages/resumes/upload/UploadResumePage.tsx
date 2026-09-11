import { DuplicateResumeDialog } from "./components/DuplicateResumeDialog"
import { BulkImportConflictsDialog } from "./components/BulkImportConflictsDialog"
import type { ConflictResolution } from "./components/BulkImportConflictsDialog"
import { getResume, createResume, updateResume } from "@/db/resume"
import { Heading1, Subheading } from "@/components/ui"
import { UploadResumeJson } from "./UploadResumeJson"
import type { BatchParsedItem } from "./hooks/useUploadResume"
import { useModal } from "@/components/modal"
import { useNavigate } from "react-router-dom"
import { usePageTitle } from "@/hooks/usePageTitle"
import { useToast } from "@/components/toast"
import type { Resume } from "@/db/db"

interface ImportCounts {
  imported: number
  overwritten: number
  copied: number
  kept: number
}

function summarizeCounts(counts: ImportCounts): string {
  const parts: string[] = []
  if (counts.imported > 0) {
    parts.push(`${counts.imported} imported`)
  }
  if (counts.overwritten > 0) {
    parts.push(`${counts.overwritten} overwritten`)
  }
  if (counts.copied > 0) {
    parts.push(`${counts.copied} copied`)
  }
  if (counts.kept > 0) {
    parts.push(`${counts.kept} kept`)
  }
  return parts.join(", ")
}

export default function UploadResumePage() {
  usePageTitle("Upload resume")
  const navigate = useNavigate()
  const toast = useToast()

  const { open: openConflictModal } = useModal(DuplicateResumeDialog, {
    contentClassName: "max-w-lg",
  })
  const { open: openBulkConflictModal } = useModal(BulkImportConflictsDialog, {
    contentClassName: "max-w-xl",
    closeOnBackdropClick: false,
    closeOnEscape: false,
  })

  const importFreshResume = async (incomingResume: Resume, incomingResumeId: string) => {
    await createResume(incomingResume.title, incomingResume.sections, {
      id: incomingResumeId,
      syncProfile: incomingResume.syncProfile,
      contact: incomingResume.contact,
    })
  }

  const applyResolution = async (
    incomingResume: Resume,
    existingId: string,
    decision: "overwrite" | "copy",
  ) => {
    if (decision === "overwrite") {
      await updateResume(existingId, {
        title: incomingResume.title,
        sections: incomingResume.sections,
        syncProfile: incomingResume.syncProfile,
        contact: incomingResume.contact,
      })
    } else {
      await createResume(`Copy of ${incomingResume.title}`, incomingResume.sections, {
        syncProfile: incomingResume.syncProfile,
        contact: incomingResume.contact,
      })
    }
  }

  const finishBatch = (counts: ImportCounts) => {
    const total = counts.imported + counts.overwritten + counts.copied
    if (total === 0 && counts.kept > 0) {
      toast.success("Nothing imported", "Kept the existing resumes.")
      return
    }
    toast.success("Resumes imported", summarizeCounts(counts))
    navigate("/resumes")
  }

  const handleBatchParsed = async (items: BatchParsedItem[]) => {
    const counts: ImportCounts = { imported: 0, overwritten: 0, copied: 0, kept: 0 }
    const conflicts: {
      incomingResume: Resume
      incomingResumeId: string
      existingResume: Resume
      sourceName: string
    }[] = []

    for (const item of items) {
      const existingResume = await getResume(item.resumeId)
      if (!existingResume) {
        await importFreshResume(item.resume, item.resumeId)
        counts.imported += 1
      } else {
        conflicts.push({
          incomingResume: item.resume,
          incomingResumeId: item.resumeId,
          existingResume,
          sourceName: item.sourceName,
        })
      }
    }

    if (conflicts.length === 0) {
      finishBatch(counts)
      return
    }

    if (conflicts.length === 1) {
      const conflict = conflicts[0]
      openConflictModal({
        existingResume: conflict.existingResume,
        incomingResume: conflict.incomingResume,
        incomingResumeId: conflict.incomingResumeId,
        onOverwrite: async () => {
          await applyResolution(conflict.incomingResume, conflict.existingResume.id!, "overwrite")
          counts.overwritten += 1
          finishBatch(counts)
        },
        onCreateCopy: async () => {
          await applyResolution(conflict.incomingResume, conflict.existingResume.id!, "copy")
          counts.copied += 1
          finishBatch(counts)
        },
      })
      return
    }

    openBulkConflictModal({
      items: conflicts,
      onApply: async (resolutions: ConflictResolution[]) => {
        for (const resolution of resolutions) {
          if (resolution.decision === "keep") {
            counts.kept += 1
            continue
          }
          await applyResolution(
            resolution.item.incomingResume,
            resolution.item.existingResume.id!,
            resolution.decision,
          )
          if (resolution.decision === "overwrite") {
            counts.overwritten += 1
          } else {
            counts.copied += 1
          }
        }
      },
      onComplete: () => finishBatch(counts),
    })
  }

  return (
    <section className="flex flex-col gap-6">
      <header>
        <div className="flex flex-col gap-1">
          <Heading1>Upload Resume</Heading1>
          <Subheading>Import existing resumes from JSON or ZIP files.</Subheading>
        </div>
      </header>
      <UploadResumeJson onBatchParsed={handleBatchParsed} />
    </section>
  )
}
