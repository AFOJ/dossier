import { act, render } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { DEFAULT_SETTINGS } from "@/db/settings"
import { ThemeController } from "@/components/ThemeController"
import { THEME_STORAGE_KEY } from "@/lib/theme"

const settingsMock = vi.hoisted(() => ({
  useSettings: vi.fn(),
}))

vi.mock("@/hooks/useSettings", () => ({ useSettings: settingsMock.useSettings }))

describe("ThemeController", () => {
  let systemDark = false
  let listener: (() => void) | undefined

  beforeEach(() => {
    localStorage.clear()
    document.documentElement.className = ""
    document.documentElement.removeAttribute("data-theme")
    document.documentElement.style.colorScheme = ""
    systemDark = false
    listener = undefined
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({
        get matches() {
          return systemDark
        },
        addEventListener: (_event: string, callback: () => void) => {
          listener = callback
        },
        removeEventListener: vi.fn(),
      })),
    )
  })

  afterEach(() => vi.unstubAllGlobals())

  it.each(["light", "dark"] as const)("applies an explicit %s theme", (theme) => {
    settingsMock.useSettings.mockReturnValue({
      settings: { ...DEFAULT_SETTINGS, appearance: { theme } },
      isLoaded: true,
    })
    render(<ThemeController />)
    expect(document.documentElement.dataset.theme).toBe(theme)
    expect(document.documentElement.classList.contains("dark")).toBe(theme === "dark")
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe(theme)
  })

  it("tracks operating-system changes for the system preference", () => {
    settingsMock.useSettings.mockReturnValue({ settings: DEFAULT_SETTINGS, isLoaded: true })
    render(<ThemeController />)
    expect(document.documentElement.dataset.theme).toBe("light")
    act(() => {
      systemDark = true
      listener?.()
    })
    expect(document.documentElement.dataset.theme).toBe("dark")
    expect(document.documentElement).toHaveClass("dark")
  })

  it("does not replace the bootstrap theme before settings load", () => {
    document.documentElement.classList.add("dark")
    document.documentElement.dataset.theme = "dark"
    settingsMock.useSettings.mockReturnValue({ settings: DEFAULT_SETTINGS, isLoaded: false })
    render(<ThemeController />)
    expect(document.documentElement.dataset.theme).toBe("dark")
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull()
  })
})
