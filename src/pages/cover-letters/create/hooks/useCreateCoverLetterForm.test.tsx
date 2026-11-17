import { act, renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import type { Profile } from "@/db/db"
import { DEFAULT_SETTINGS } from "@/db/settings"
import { useCreateCoverLetterForm } from "./useCreateCoverLetterForm"

vi.mock("react-router-dom", () => ({ useNavigate: () => vi.fn() }))
vi.mock("@/components/toast", () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn() }),
}))

const profile: Profile = {
  id: 1,
  full_name: "Jane Roe",
  role: "Engineer",
  email: "jane@example.com",
  phone: null,
  location: null,
  links: [],
}

describe("useCreateCoverLetterForm title default", () => {
  it("starts without a title when no default is configured", () => {
    const { result } = renderHook(() => useCreateCoverLetterForm(profile))
    expect(result.current.form.getValues("title")).toBe("")
    expect(result.current.isDirty).toBe(false)
  })

  it("hydrates a title format without replacing a title already entered", () => {
    const stored = {
      ...DEFAULT_SETTINGS,
      documents: {
        ...DEFAULT_SETTINGS.documents,
        defaultCoverLetterTitleFormat: "{profile.role} Application",
      },
    }
    const { result, rerender } = renderHook(
      ({ loaded }: { loaded: boolean }) =>
        useCreateCoverLetterForm(profile, loaded ? stored : DEFAULT_SETTINGS, loaded),
      { initialProps: { loaded: false } },
    )
    rerender({ loaded: true })
    expect(result.current.form.getValues("title")).toBe("Engineer Application")
    expect(result.current.isDirty).toBe(false)

    const second = renderHook(
      ({ loaded }: { loaded: boolean }) =>
        useCreateCoverLetterForm(profile, loaded ? stored : DEFAULT_SETTINGS, loaded),
      { initialProps: { loaded: false } },
    )
    act(() => second.result.current.form.setValue("title", "My title", { shouldDirty: true }))
    second.rerender({ loaded: true })
    expect(second.result.current.form.getValues("title")).toBe("My title")
  })

  it("does not replace an empty title after the user has focused it", () => {
    const stored = {
      ...DEFAULT_SETTINGS,
      documents: {
        ...DEFAULT_SETTINGS.documents,
        defaultCoverLetterTitleFormat: "{profile.role} Application",
      },
    }
    const { result, rerender } = renderHook(
      ({ loaded }: { loaded: boolean }) =>
        useCreateCoverLetterForm(profile, loaded ? stored : DEFAULT_SETTINGS, loaded),
      { initialProps: { loaded: false } },
    )
    act(() => result.current.form.setValue("title", "", { shouldTouch: true }))
    expect(result.current.form.formState.touchedFields.title).toBe(true)
    rerender({ loaded: true })
    expect(result.current.form.getValues("title")).toBe("")
  })
})
