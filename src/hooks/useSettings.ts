import { useInitialPageData } from "@/hooks/useInitialPageData"
import { useMemo } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { DEFAULT_SETTINGS, getSettings, type Settings } from "@/db/settings"

/**
 * Reads the app settings reactively. Starts from the defaults so consumers
 * render sensible values on the first pass. Production routes provide their
 * initial read so mounting a page does not flash a loading placeholder.
 */
export function useSettings() {
  const initial = useInitialPageData()?.settings
  const stored = useLiveQuery(() => getSettings(), [], initial)

  return useMemo(
    () => ({
      /** The stored settings, or the defaults until they have been read. */
      settings: stored ?? DEFAULT_SETTINGS,
      /** False until the stored settings have arrived. */
      isLoaded: stored !== undefined,
    }),
    [stored],
  )
}

export type { Settings }
