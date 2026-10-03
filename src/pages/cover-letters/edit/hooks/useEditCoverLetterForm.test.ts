import { renderHook, act } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import type { CoverLetter, Profile } from "@/db/db"
import { updateCoverLetter } from "@/db/coverLetter"
import { useEditCoverLetterForm } from "@/pages/cover-letters/edit/hooks/useEditCoverLetterForm"

vi.mock("@/db/coverLetter", () => ({
  updateCoverLetter: vi.fn(),
}))

const mockNavigate = vi.fn()
vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}))

const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
}

vi.mock("@/components/toast", () => ({
  useToast: () => mockToast,
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
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("prefills contact details from the profile when the letter is synced", () => {
    const { result } = renderHook(() => useEditCoverLetterForm(makeLetter(), profile))

    expect(result.current.form.getValues("fullName")).toBe("John Doe")
    expect(result.current.form.getValues("jobTitle")).toBe("Engineer")
    expect(result.current.form.getValues("email")).toBe("john@doe.com")
  })

  it("restores profile contact details when sync is turned back on", () => {
    const letter = makeLetter({
      syncProfile: false,
      contact: {
        full_name: "Snapshot Person",
        role: null,
        email: null,
        phone: null,
        location: null,
      },
    })

    const { result } = renderHook(() => useEditCoverLetterForm(letter, profile))

    act(() => {
      result.current.form.setValue("fullName", "Local Edit", { shouldDirty: true })
    })
    expect(result.current.form.getValues("fullName")).toBe("Local Edit")

    act(() => {
      result.current.setSyncProfile(true)
    })

    expect(result.current.form.getValues("fullName")).toBe("John Doe")
    expect(result.current.form.getValues("jobTitle")).toBe("Engineer")
  })

  it("uses the stored contact snapshot when the letter is unsynced", () => {
    const letter = makeLetter({
      syncProfile: false,
      contact: {
        full_name: "Snapshot Person",
        role: null,
        email: null,
        phone: null,
        location: null,
      },
    })

    const { result } = renderHook(() => useEditCoverLetterForm(letter, profile))

    expect(result.current.form.getValues("fullName")).toBe("Snapshot Person")
  })

  it("saves the contact snapshot when sync is off", async () => {
    vi.mocked(updateCoverLetter).mockResolvedValueOnce(undefined)
    const { result } = renderHook(() =>
      useEditCoverLetterForm(
        makeLetter({
          syncProfile: false,
          contact: {
            full_name: "Snapshot Person",
            role: null,
            email: null,
            phone: null,
            location: null,
          },
        }),
        profile,
      ),
    )

    await act(async () => {
      await result.current.onSubmit()
    })

    expect(updateCoverLetter).toHaveBeenCalledWith(
      "letter-1",
      expect.objectContaining({
        syncProfile: false,
        contact: expect.objectContaining({ full_name: "Snapshot Person" }),
      }),
    )
  })
})
