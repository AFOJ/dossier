import { db, type AppSettings } from "@/db/db"
import { DEFAULT_RESUME_TITLE_FORMAT } from "@/lib/titleFormat"

export type Settings = Omit<AppSettings, "id">

export const SETTINGS_ID = "app"

export const DEFAULT_SETTINGS: Settings = {
  // Matches the behaviour before settings existed, so upgrading does not change
  // what a new document starts as.
  defaultSyncProfile: true,
  defaultResumeTitleFormat: DEFAULT_RESUME_TITLE_FORMAT,
}

/**
 * Reads the app settings, falling back to the defaults when nothing has been
 * saved yet. Callers never have to handle absence.
 */
export async function getSettings(): Promise<Settings> {
  const { defaultSyncProfile, defaultResumeTitleFormat } = (await db.settings.get(SETTINGS_ID)) ?? {
    ...DEFAULT_SETTINGS,
  }

  return { defaultSyncProfile, defaultResumeTitleFormat }
}

/** Merges `data` into the saved settings, leaving unspecified keys alone. */
export async function upsertSettings(data: Partial<Settings>): Promise<void> {
  const existing = await db.settings.get(SETTINGS_ID)

  await db.settings.put({ ...DEFAULT_SETTINGS, ...existing, ...data, id: SETTINGS_ID })
}

/** Restores a full settings row as it came out of an export file. */
export async function replaceSettings(settings: Settings): Promise<void> {
  await db.settings.put({ ...settings, id: SETTINGS_ID })
}
