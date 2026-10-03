import { renderHook, act } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import type { CoverLetter, Profile } from "@/db/db"
import { useEditCoverLetterForm } from "@/pages/cover-letters/edit/hooks/useEditCoverLetterForm"

vi.mock("@/db/coverLetter", () => ({ updateCoverLetter: vi.fn() }))
vi.mock("react-router-dom", () => ({ useNavigate: () => {} }))
vi.mock("@/components/toast", () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn() }),
}))

const profile: Profile = {
  id: 1,
  full_name: "John Doe",
  role: "Engineer",
  email: "john@doe.com",
  phone: null,
  location: null,
  links: [],
}

const snapshot = {
  full_name: "Snapshot Person",
  role: null,
  email: null,
  phone: null,
  location: null,
}

function makeLetter(overrides: Partial<CoverLetter> = {}): CoverLetter {
  return {
    id: "letter-1",
    title: "My Cover Letter",
    body: "<p>Hello</p>",
    tagIds: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    syncProfile: true,
    contact: null,
    ...overrides,
  }
}

describe("useEditCoverLetterForm", () => {
  it("prefills a synced letter from the profile", () => {
    const { result } = renderHook(() => useEditCoverLetterForm(makeLetter(), profile))

    expect(result.current.form.getValues("fullName")).toBe("John Doe")
  })

  it("restores the profile over local edits when sync is turned back on", () => {
    const letter = makeLetter({ syncProfile: false, contact: snapshot })
    const { result } = renderHook(() => useEditCoverLetterForm(letter, profile))

    // An unsynced letter starts from its own snapshot, not the profile.
    expect(result.current.form.getValues("fullName")).toBe("Snapshot Person")

    act(() => {
      result.current.form.setValue("fullName", "Local Edit", { shouldDirty: true })
      result.current.setSyncProfile(true)
    })

    expect(result.current.form.getValues("fullName")).toBe("John Doe")
    expect(result.current.form.getValues("jobTitle")).toBe("Engineer")
  })
})
