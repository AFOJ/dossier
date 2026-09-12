import { DuplicateCoverLetterDialog } from "./components/DuplicateCoverLetterDialog"
import { BulkImportConflictsDialog } from "./components/BulkImportConflictsDialog"
import type { ConflictResolution } from "./components/BulkImportConflictsDialog"
import { getCoverLetter, createCoverLetter, updateCoverLetter } from "@/db/coverLetter"
import { Heading1, Subheading } from "@/components/ui"
import { UploadCoverLetterJson } from "./UploadCoverLetterJson"
import type { BatchParsedItem } from "./hooks/useUploadCoverLetter"
import { useModal } from "@/components/modal"
import { useNavigate } from "react-router-dom"
import { usePageTitle } from "@/hooks/usePageTitle"
import { useToast } from "@/components/toast"
import type { CoverLetter } from "@/db/db"

interface ImportCounts {
  imported: number
  overwritten: number
  copied: number
  kept: number
  failed: number
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
  if (counts.failed > 0) {
    parts.push(`${counts.failed} failed`)
  }
  return parts.join(", ")
}

export default function UploadCoverLetterPage() {
  usePageTitle("Upload cover letter")
  const navigate = useNavigate()
  const toast = useToast()

  const { open: openConflictModal } = useModal(DuplicateCoverLetterDialog, {
    contentClassName: "max-w-lg",
  })
  const { open: openBulkConflictModal } = useModal(BulkImportConflictsDialog, {
    contentClassName: "max-w-xl",
    closeOnBackdropClick: false,
    closeOnEscape: false,
  })

  const importFreshLetter = async (incoming: CoverLetter, incomingId: string) => {
    await createCoverLetter(
      {
        title: incoming.title,
        subject: incoming.subject,
        signoff: incoming.signoff,
        body: incoming.body,
      },
      {
        id: incomingId,
        syncProfile: incoming.syncProfile,
        contact: incoming.contact,
      },
    )
  }

  const applyResolution = async (
    incoming: CoverLetter,
    existingId: string,
    decision: "overwrite" | "copy",
  ) => {
    if (decision === "overwrite") {
      await updateCoverLetter(existingId, {
        title: incoming.title,
        subject: incoming.subject,
        signoff: incoming.signoff,
        body: incoming.body,
        syncProfile: incoming.syncProfile,
        contact: incoming.contact,
      })
    } else {
      await createCoverLetter(
        {
          title: `Copy of ${incoming.title}`,
          subject: incoming.subject,
          signoff: incoming.signoff,
          body: incoming.body,
        },
        {
          syncProfile: incoming.syncProfile,
          contact: incoming.contact,
        },
      )
    }
  }

  const finishBatch = (counts: ImportCounts) => {
    const total = counts.imported + counts.overwritten + counts.copied
    if (total === 0 && counts.failed === 0 && counts.kept > 0) {
      toast.success("Nothing imported", "Kept the existing cover letters.")
      return
    }
    if (counts.failed > 0) {
      toast.error("Import partially completed", summarizeCounts(counts))
    } else {
      toast.success("Cover letters imported", summarizeCounts(counts))
    }
    navigate("/cover-letters")
  }

  const handleBatchParsed = async (items: BatchParsedItem[]) => {
    const counts: ImportCounts = { imported: 0, overwritten: 0, copied: 0, kept: 0, failed: 0 }
    const conflicts: {
      incomingLetter: CoverLetter
      incomingLetterId: string
      existingLetter: CoverLetter
      sourceName: string
    }[] = []

    for (const item of items) {
      const existingLetter = await getCoverLetter(item.letterId)
      if (!existingLetter) {
        try {
          await importFreshLetter(item.letter, item.letterId)
          counts.imported += 1
        } catch {
          counts.failed += 1
        }
      } else {
        conflicts.push({
          incomingLetter: item.letter,
          incomingLetterId: item.letterId,
          existingLetter,
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
        existingLetter: conflict.existingLetter,
        incomingLetter: conflict.incomingLetter,
        incomingLetterId: conflict.incomingLetterId,
        onOverwrite: async () => {
          await applyResolution(conflict.incomingLetter, conflict.existingLetter.id!, "overwrite")
          counts.overwritten += 1
          finishBatch(counts)
        },
        onCreateCopy: async () => {
          await applyResolution(conflict.incomingLetter, conflict.existingLetter.id!, "copy")
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
          try {
            await applyResolution(
              resolution.item.incomingLetter,
              resolution.item.existingLetter.id!,
              resolution.decision,
            )
          } catch {
            counts.failed += 1
            continue
          }
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
          <Heading1>Upload Cover Letter</Heading1>
          <Subheading>Import existing cover letters from JSON or ZIP files.</Subheading>
        </div>
      </header>
      <UploadCoverLetterJson onBatchParsed={handleBatchParsed} />
    </section>
  )
}
