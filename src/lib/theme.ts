import type { ThemePreference } from "@/db/settings"

export const THEME_STORAGE_KEY = "dossier-theme"
export const SYSTEM_THEME_QUERY = "(prefers-color-scheme: dark)"

export type ResolvedTheme = Exclude<ThemePreference, "system">

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === "system" || value === "light" || value === "dark"
}

export function resolveTheme(
  preference: ThemePreference,
  systemPrefersDark: boolean,
): ResolvedTheme {
  return preference === "system" ? (systemPrefersDark ? "dark" : "light") : preference
}

export function applyResolvedTheme(theme: ResolvedTheme): void {
  const root = document.documentElement
  root.classList.toggle("dark", theme === "dark")
  root.dataset.theme = theme
  root.style.colorScheme = theme
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", theme === "dark" ? "#000000" : "#ffffff")
}

export function readBootstrapTheme(): ThemePreference {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
    return isThemePreference(stored) ? stored : "system"
  } catch {
    return "system"
  }
}

export function writeBootstrapTheme(theme: ThemePreference): void {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // The IndexedDB setting remains authoritative when storage is unavailable.
  }
}
