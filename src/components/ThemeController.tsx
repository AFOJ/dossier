import { useEffect } from "react"
import { useSettings } from "@/hooks/useSettings"
import {
  applyResolvedTheme,
  resolveTheme,
  SYSTEM_THEME_QUERY,
  writeBootstrapTheme,
} from "@/lib/theme"

export function ThemeController() {
  const { settings, isLoaded } = useSettings()
  const preference = settings.appearance.theme

  useEffect(() => {
    if (!isLoaded) return

    const media = window.matchMedia?.(SYSTEM_THEME_QUERY)
    const systemPrefersDark = () => media?.matches ?? false
    const apply = () => applyResolvedTheme(resolveTheme(preference, systemPrefersDark()))

    writeBootstrapTheme(preference)
    apply()

    if (preference !== "system" || !media) return
    media.addEventListener("change", apply)
    return () => media.removeEventListener("change", apply)
  }, [isLoaded, preference])

  return null
}
