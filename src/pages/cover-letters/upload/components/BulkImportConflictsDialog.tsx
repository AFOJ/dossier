import { useState } from "react"
import { ChevronLeftIcon, ChevronRightIcon } from "@hugeicons/core-free-icons"
import { Button, Callout, Heading3, Tooltip } from "@/components/ui"
import { cn } from "@/utils"
import type { ModalContentProps } from "@/components/modal"
import { useToast } from "@/components/toast"
import type { CoverLetter } from "@/db/db"

export type ConflictDecision = "overwrite" | "copy" | "keep"

export interface ImportConflictItem {
  incomingLetter: CoverLetter
  incomingLetterId: string
  existingLetter: CoverLetter
  sourceName: string
}

export interface ConflictResolution {
  item: ImportConflictItem
  decision: ConflictDecision
}

interface BulkImportConflictsData {
  items: ImportConflictItem[]
  onApply: (resolutions: ConflictResolution[]) => Promise<void>
  onComplete: () => void
}

function formatDate(date: Date): string {
  return date.toLocaleDateString(undefined, { dateStyle: "medium" })
}

function describeContact(letter: CoverLetter): string {
  return letter.contact?.full_name ?? "Synced with profile"
}

function ComparisonRow({
  label,
  existing,
  incoming,
}: Readonly<{ label: string; existing: string; incoming: string }>) {
  const differs = existing !== incoming
  return (
    <div className="grid grid-cols-3 gap-2 py-1.5 text-sm">
      <dt className="text-gray-500">{label}</dt>
      <dd
        className={cn(
          "min-w-0 break-words",
          differs ? "font-medium text-gray-900" : "text-gray-500",
        )}
      >
        {existing}
      </dd>
      <dd
        className={cn(
          "min-w-0 break-words",
          differs ? "font-medium text-gray-900" : "text-gray-500",
        )}
      >
        {incoming}
      </dd>
    </div>
  )
}

export function BulkImportConflictsDialog(
  props: Readonly<ModalContentProps<BulkImportConflictsData>>,
) {
  const {
    data: { items, onApply, onComplete },
    close,
  } = props
  const toast = useToast()

  const [decisions, setDecisions] = useState<Record<number, ConflictDecision>>({})
  const [index, setIndex] = useState(0)
  const [isApplying, setIsApplying] = useState(false)
  const [applyError, setApplyError] = useState<string | null>(null)

  const currentItem = items[index]
  const decidedCount = Object.keys(decisions).length
  const allDecided = decidedCount === items.length
  const currentDecision = decisions[index]

  const overwriteCounts = new Map<string, number>()
  for (const [positionKey, decision] of Object.entries(decisions)) {
    if (decision === "overwrite") {
      const conflictId = items[Number(positionKey)].incomingLetterId
      overwriteCounts.set(conflictId, (overwriteCounts.get(conflictId) ?? 0) + 1)
    }
  }
  let duplicateOverwriteCount = 0
  for (const overwriteCount of overwriteCounts.values()) {
    if (overwriteCount > 1) {
      duplicateOverwriteCount += overwriteCount
    }
  }

  const setDecision = (decision: ConflictDecision) => {
    const updated = { ...decisions }
    if (updated[index] === decision) {
      delete updated[index]
    } else {
      updated[index] = decision
    }
    setDecisions(updated)
  }

  const applyToRemaining = (decision: ConflictDecision) => {
    const updated: Record<number, ConflictDecision> = { ...decisions }
    for (let position = 0; position < items.length; position += 1) {
      if (updated[position] === undefined) {
        updated[position] = decision
      }
    }
    setDecisions(updated)
  }

  const handleImport = async () => {
    const resolutions: ConflictResolution[] = []
    for (let position = 0; position < items.length; position += 1) {
      const decision = decisions[position]
      if (decision) {
        resolutions.push({ item: items[position], decision })
      }
    }
    if (resolutions.length !== items.length) {
      return
    }

    setIsApplying(true)
    setApplyError(null)
    try {
      await onApply(resolutions)
      onComplete()
      close()
    } catch {
      setApplyError("Failed to apply your choices. Please try again.")
      toast.error("Failed to import cover letters", "Please try again.")
      setIsApplying(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <Heading3>
          Resolve conflicts ({index + 1} of {items.length})
        </Heading3>
        <p className="text-sm leading-6 text-gray-600" aria-live="polite">
          {decidedCount} of {items.length} decided. Nothing is imported until you confirm below.
        </p>
        <p className="break-words text-sm text-gray-500">From: {currentItem.sourceName}</p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2">
        <div className="grid grid-cols-3 gap-2 pb-1 text-xs font-medium uppercase tracking-wide text-gray-500">
          <span />
          <span>Existing</span>
          <span>Incoming</span>
        </div>
        <dl className="divide-y divide-gray-200">
          <ComparisonRow
            label="Title"
            existing={currentItem.existingLetter.title}
            incoming={currentItem.incomingLetter.title}
          />
          <ComparisonRow
            label="Subject"
            existing={currentItem.existingLetter.subject ?? "—"}
            incoming={currentItem.incomingLetter.subject ?? "—"}
          />
          <ComparisonRow
            label="Last updated"
            existing={formatDate(currentItem.existingLetter.updatedAt)}
            incoming={formatDate(currentItem.incomingLetter.updatedAt)}
          />
          <ComparisonRow
            label="Contact"
            existing={describeContact(currentItem.existingLetter)}
            incoming={describeContact(currentItem.incomingLetter)}
          />
        </dl>
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Decision for this conflict">
        <Button
          intent={currentDecision === "overwrite" ? "primary" : "secondary"}
          aria-pressed={currentDecision === "overwrite"}
          onClick={() => setDecision("overwrite")}
          disabled={isApplying}
        >
          Overwrite
        </Button>
        <Button
          intent={currentDecision === "copy" ? "primary" : "secondary"}
          aria-pressed={currentDecision === "copy"}
          onClick={() => setDecision("copy")}
          disabled={isApplying}
        >
          Create copy
        </Button>
        <Button
          intent={currentDecision === "keep" ? "primary" : "secondary"}
          aria-pressed={currentDecision === "keep"}
          onClick={() => setDecision("keep")}
          disabled={isApplying}
        >
          Keep existing
        </Button>
      </div>

      <div className="flex flex-col gap-2 text-sm text-gray-600">
        <span id="apply-all-remaining">Apply to all remaining:</span>
        <div className="flex flex-wrap gap-2" role="group" aria-labelledby="apply-all-remaining">
          <Button
            intent="secondary"
            onClick={() => applyToRemaining("overwrite")}
            disabled={isApplying || allDecided}
            className="text-sm"
          >
            Overwrite all
          </Button>
          <Button
            intent="secondary"
            onClick={() => applyToRemaining("copy")}
            disabled={isApplying || allDecided}
            className="text-sm"
          >
            Copy all
          </Button>
          <Button
            intent="secondary"
            onClick={() => applyToRemaining("keep")}
            disabled={isApplying || allDecided}
            className="text-sm"
          >
            Keep all existing
          </Button>
        </div>
      </div>

      {applyError && (
        <p role="alert" className="text-sm text-red-700">
          {applyError}
        </p>
      )}

      {duplicateOverwriteCount > 0 && (
        <Callout intent="yellow" role="status">
          Heads up: {duplicateOverwriteCount} items target the same cover letter with Overwrite.
          Only the last in the list will remain. Use Keep existing or Create copy for the others.
        </Callout>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1">
          <Tooltip content="Previous conflict">
            <span className="inline-block">
              <Button
                aria-label="Previous conflict"
                intent="secondary"
                icon={ChevronLeftIcon}
                onClick={() => setIndex((previous) => Math.max(0, previous - 1))}
                disabled={isApplying || index === 0}
                className="size-8 border-0 p-0 text-gray-500 hover:text-gray-900"
              />
            </span>
          </Tooltip>
          <Tooltip content="Next conflict">
            <span className="inline-block">
              <Button
                aria-label="Next conflict"
                intent="secondary"
                icon={ChevronRightIcon}
                onClick={() => setIndex((previous) => Math.min(items.length - 1, previous + 1))}
                disabled={isApplying || index === items.length - 1}
                className="size-8 border-0 p-0 text-gray-500 hover:text-gray-900"
              />
            </span>
          </Tooltip>
        </div>
        <div className="flex gap-2">
          <Button intent="secondary" onClick={close} disabled={isApplying} autoFocus>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={!allDecided || isApplying}>
            {isApplying ? "Applying…" : `Import (${decidedCount}/${items.length})`}
          </Button>
        </div>
      </div>
    </div>
  )
}
