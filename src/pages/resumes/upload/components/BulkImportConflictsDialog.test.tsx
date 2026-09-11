import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { BulkImportConflictsDialog } from "@/pages/resumes/upload/components/BulkImportConflictsDialog"
import type {
  ConflictResolution,
  ImportConflictItem,
} from "@/pages/resumes/upload/components/BulkImportConflictsDialog"
import type { Resume } from "@/db/db"

function makeResume(overrides: Partial<Resume> = {}): Resume {
  return {
    id: crypto.randomUUID(),
    title: "Untitled",
    sections: [],
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-02-01T00:00:00.000Z"),
    syncProfile: true,
    contact: null,
    ...overrides,
  }
}

function makeConflict(id: string, title: string): ImportConflictItem {
  return {
    incomingResume: makeResume({ title: `Incoming ${title}` }),
    incomingResumeId: id,
    existingResume: makeResume({ id, title: `Existing ${title}` }),
    sourceName: `${title}.json`,
  }
}

describe("BulkImportConflictsDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  function renderDialog(items: ImportConflictItem[], onApply = vi.fn(), onComplete = vi.fn()) {
    const close = vi.fn()
    render(<BulkImportConflictsDialog data={{ items, onApply, onComplete }} close={close} />)
    return { onApply, onComplete, close }
  }

  it("stays on the current conflict after deciding", async () => {
    const user = userEvent.setup()
    renderDialog([makeConflict("1", "One"), makeConflict("2", "Two")])

    expect(screen.getByText("Resolve conflicts (1 of 2)")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Overwrite" }))

    expect(screen.getByText("Resolve conflicts (1 of 2)")).toBeInTheDocument()
    expect(screen.getByText(/1 of 2 decided/)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Overwrite", pressed: true })).toBeInTheDocument()
  })

  it("navigates between conflicts and keeps decisions per item", async () => {
    const user = userEvent.setup()
    renderDialog([makeConflict("1", "One"), makeConflict("2", "Two")])

    await user.click(screen.getByRole("button", { name: "Overwrite" }))
    await user.click(screen.getByRole("button", { name: "Next conflict" }))

    expect(screen.getByText("Resolve conflicts (2 of 2)")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Overwrite", pressed: false })).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Previous conflict" }))
    expect(screen.getByText("Resolve conflicts (1 of 2)")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Overwrite", pressed: true })).toBeInTheDocument()
    expect(screen.getByText(/1 of 2 decided/)).toBeInTheDocument()
  })

  it("applies one decision to every conflict", async () => {
    const user = userEvent.setup()
    const { onApply, onComplete, close } = renderDialog([
      makeConflict("1", "One"),
      makeConflict("2", "Two"),
      makeConflict("3", "Three"),
    ])

    await user.click(screen.getByRole("button", { name: "Keep all existing" }))

    const importButton = screen.getByRole("button", { name: "Import (3/3)" })
    await user.click(importButton)

    await waitFor(() => {
      expect(onApply).toHaveBeenCalledTimes(1)
    })
    const resolutions = onApply.mock.calls[0][0]
    expect(resolutions.map((resolution: ConflictResolution) => resolution.decision)).toEqual([
      "keep",
      "keep",
      "keep",
    ])
    expect(onComplete).toHaveBeenCalled()
    expect(close).toHaveBeenCalled()
  })

  it("decides duplicate resume ids independently per item", async () => {
    const user = userEvent.setup()
    const shared = makeConflict("same-id", "Shared")
    const { onApply } = renderDialog([
      { ...shared, sourceName: "first.json" },
      { ...shared, sourceName: "second.json" },
    ])

    await user.click(screen.getByRole("button", { name: "Next conflict" }))
    await user.click(screen.getByRole("button", { name: "Create copy" }))

    expect(screen.getByText("Resolve conflicts (2 of 2)")).toBeInTheDocument()
    expect(screen.getByText(/1 of 2 decided/)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Create copy", pressed: true })).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Previous conflict" }))
    expect(screen.getByText("Resolve conflicts (1 of 2)")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Create copy", pressed: false })).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Keep existing" }))
    await user.click(screen.getByRole("button", { name: "Import (2/2)" }))

    await waitFor(() => {
      expect(onApply).toHaveBeenCalledTimes(1)
    })
    const resolutions = onApply.mock.calls[0][0]
    expect(resolutions.map((resolution: ConflictResolution) => resolution.decision)).toEqual([
      "keep",
      "copy",
    ])
    expect(resolutions[0].item.sourceName).toBe("first.json")
    expect(resolutions[1].item.sourceName).toBe("second.json")
  })

  it("applies bulk choices only to undecided conflicts", async () => {
    const user = userEvent.setup()
    const { onApply } = renderDialog([makeConflict("1", "One"), makeConflict("2", "Two")])

    await user.click(screen.getByRole("button", { name: "Overwrite" }))
    await user.click(screen.getByRole("button", { name: "Copy all" }))

    await user.click(screen.getByRole("button", { name: "Import (2/2)" }))

    await waitFor(() => {
      expect(onApply).toHaveBeenCalledTimes(1)
    })
    const resolutions = onApply.mock.calls[0][0]
    expect(resolutions.map((resolution: ConflictResolution) => resolution.decision)).toEqual([
      "overwrite",
      "copy",
    ])
  })

  it("re-trigger apply-all after clearing an individual decision", async () => {
    const user = userEvent.setup()
    const { onApply } = renderDialog([makeConflict("1", "One"), makeConflict("2", "Two")])

    await user.click(screen.getByRole("button", { name: "Copy all" }))
    await user.click(screen.getByRole("button", { name: "Create copy", pressed: true }))
    expect(screen.getByText(/1 of 2 decided/)).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Keep all existing" }))
    await user.click(screen.getByRole("button", { name: "Import (2/2)" }))

    await waitFor(() => {
      expect(onApply).toHaveBeenCalledTimes(1)
    })
    const resolutions = onApply.mock.calls[0][0]
    expect(resolutions.map((resolution: ConflictResolution) => resolution.decision)).toEqual([
      "keep",
      "copy",
    ])
  })

  it("clears a decision when its selected option is clicked again", async () => {
    const user = userEvent.setup()
    renderDialog([makeConflict("1", "One"), makeConflict("2", "Two")])

    await user.click(screen.getByRole("button", { name: "Overwrite" }))
    expect(screen.getByText(/1 of 2 decided/)).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Overwrite", pressed: true }))
    expect(screen.getByText(/0 of 2 decided/)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Import (0/2)" })).toBeDisabled()
  })

  it("warns when duplicate resumes are all set to overwrite", async () => {
    const user = userEvent.setup()
    const shared = makeConflict("same-id", "Shared")
    renderDialog([
      { ...shared, sourceName: "first.json" },
      { ...shared, sourceName: "second.json" },
    ])

    expect(screen.queryByText(/only the last one applied will remain/)).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Overwrite all" }))
    expect(screen.getByText(/2 items target the same resume/)).toBeInTheDocument()
    expect(screen.getByText(/last in the list will remain/)).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Overwrite", pressed: true }))
    await user.click(screen.getByRole("button", { name: "Keep existing" }))
    expect(screen.queryByText(/last in the list will remain/)).not.toBeInTheDocument()
  })

  it("keeps the import button disabled until every conflict is decided", async () => {
    const user = userEvent.setup()
    renderDialog([makeConflict("1", "One"), makeConflict("2", "Two")])

    expect(screen.getByRole("button", { name: "Import (0/2)" })).toBeDisabled()

    await user.click(screen.getByRole("button", { name: "Create copy" }))

    expect(screen.getByRole("button", { name: "Import (1/2)" })).toBeDisabled()
  })
})
