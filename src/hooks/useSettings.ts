import { useCallback } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { DEFAULT_SETTINGS, getSettings, upsertSettings, type Settings } from "@/db/settings"

/**
 * Reads the app settings reactively. Starts from the defaults so consumers
 * render sensible values on the first pass, then swaps in whatever is stored.
 */
export function useSettings() {
  const stored = useLiveQuery(() => getSettings(), [])

  const update = useCallback(async (data: Partial<Settings>) => {
    await upsertSettings(data)
  }, [])

  return {
    /** The stored settings, or the defaults until they have been read. */
    settings: stored ?? DEFAULT_SETTINGS,
    /** False until the stored settings have arrived. */
    isLoaded: stored !== undefined,
    update,
  }
}
