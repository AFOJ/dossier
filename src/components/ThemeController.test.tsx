import { act, render } from "@testing-library/react"
import bootstrapHtml from "../../index.html?raw"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { DEFAULT_SETTINGS } from "@/db/settings"
import { ThemeController } from "@/components/ThemeController"
import { readBootstrapTheme, THEME_STORAGE_KEY, writeBootstrapTheme } from "@/lib/theme"

const settingsMock = vi.hoisted(() => ({
  useSettings: vi.fn(),
}))

function runBootstrapWithBlockedStorage() {
  const script = bootstrapHtml.match(/<script>([\s\S]*?)<\/script>/)?.[1]
  if (!script) throw new Error("Theme bootstrap script was not found")
  const runBootstrap = new Function("document", "localStorage", "matchMedia", script)
  runBootstrap(
    document,
    {
      getItem: () => {
        throw new Error("Storage blocked")
      },
    },
    () => ({ matches: false }),
  )
}

vi.mock("@/hooks/useSettings", () => ({ useSettings: settingsMock.useSettings }))

describe("ThemeController", () => {
  let systemDark = false
  let listener: (() => void) | undefined

  beforeEach(() => {
    localStorage.clear()
    document.cookie = `${THEME_STORAGE_KEY}=; Max-Age=0; Path=/`
    document.documentElement.className = ""
    document.documentElement.removeAttribute("data-theme")
    document.documentElement.removeAttribute("data-theme-pending")
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

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    document.cookie = `${THEME_STORAGE_KEY}=; Max-Age=0; Path=/`
  })

  it.each(["light", "dark"] as const)("applies an explicit %s theme", (theme) => {
    settingsMock.useSettings.mockReturnValue({
      settings: { ...DEFAULT_SETTINGS, appearance: { theme } },
      isLoaded: true,
    })
    render(<ThemeController />)
    expect(document.documentElement.dataset.theme).toBe(theme)
    expect(document.documentElement.classList.contains("dark")).toBe(theme === "dark")
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe(theme)
    expect(document.cookie).toContain(`${THEME_STORAGE_KEY}=${theme}`)
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
    expect(document.documentElement).toHaveClass("dark")
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull()
  })

  it("reads the cookie mirror when localStorage is blocked", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("Storage blocked")
    })
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("Storage blocked")
    })
    writeBootstrapTheme("dark")
    expect(readBootstrapTheme()).toBe("dark")
    expect(document.cookie).toContain(`${THEME_STORAGE_KEY}=dark`)
  })

  it("uses the system preference when both bootstrap stores are unavailable", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("Storage blocked")
    })
    expect(readBootstrapTheme()).toBe("system")
  })

  it("applies the cookie theme in the pre-render bootstrap when localStorage is blocked", () => {
    document.cookie = `${THEME_STORAGE_KEY}=dark; Path=/`
    runBootstrapWithBlockedStorage()
    expect(document.documentElement).toHaveClass("dark")
    expect(document.documentElement.dataset.theme).toBe("dark")
    expect(document.documentElement).not.toHaveAttribute("data-theme-pending")
  })

  it("keeps the page hidden until IndexedDB resolves if both bootstrap stores are unavailable", () => {
    runBootstrapWithBlockedStorage()
    expect(document.documentElement).toHaveAttribute("data-theme-pending")
    settingsMock.useSettings.mockReturnValue({
      settings: { ...DEFAULT_SETTINGS, appearance: { theme: "dark" } },
      isLoaded: true,
    })
    render(<ThemeController />)
    expect(document.documentElement).toHaveClass("dark")
    expect(document.documentElement).not.toHaveAttribute("data-theme-pending")
  })
})
