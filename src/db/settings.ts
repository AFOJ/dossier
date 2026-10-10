import { db, type AppSettings } from "@/db/db"
import { appSettingsSchema } from "@/db/schemas"
import {
  DEFAULT_RESUME_TITLE_FORMAT,
  DEFAULT_EXPORT_FILENAME_FORMAT,
  DEFAULT_PDF_FILENAME_FORMAT_RESUME,
  DEFAULT_PDF_FILENAME_FORMAT_COVER_LETTER,
  DEFAULT_PDF_FILENAME_FORMAT_SHARED,
} from "@/lib/titleFormat"

export type Settings = Omit<AppSettings, "id">

export const SETTINGS_ID = "app"

export const DEFAULT_SETTINGS: Settings = {
  defaultSyncProfile: true,
  defaultResumeTitleFormat: DEFAULT_RESUME_TITLE_FORMAT,
  defaultExportFilenameFormat: DEFAULT_EXPORT_FILENAME_FORMAT,
  defaultResumePdfFilenameFormat: DEFAULT_PDF_FILENAME_FORMAT_RESUME,
  defaultCoverLetterPdfFilenameFormat: DEFAULT_PDF_FILENAME_FORMAT_COVER_LETTER,
  defaultPdfFilenameFormat: DEFAULT_PDF_FILENAME_FORMAT_SHARED,
  pdfFilenamePattern: "ad-hoc",
}

/**
 * A stored row may predate a newly added setting, so reads accept a subset and
 * let the defaults fill the gaps. Anything unrecognised is stripped.
 */
const STORED_SETTINGS_SCHEMA = appSettingsSchema.partial()

/**
 * Reads the app settings, falling back to the defaults when the row is missing,
 * incomplete, or corrupt. Callers never have to handle absence.
 */
export async function getSettings(): Promise<Settings> {
  const parsed = STORED_SETTINGS_SCHEMA.safeParse(await db.settings.get(SETTINGS_ID))

  return parsed.success ? { ...DEFAULT_SETTINGS, ...parsed.data } : { ...DEFAULT_SETTINGS }
}

/**
 * Merges `data` into the saved settings. The merged result is validated as a
 * whole so a partial update can never persist a value the reader would reject.
 */
export async function upsertSettings(data: Partial<Settings>): Promise<void> {
  const merged = appSettingsSchema.safeParse({ ...(await getSettings()), ...data })

  if (!merged.success) {
    throw new Error("Invalid app settings.")
  }

  await db.settings.put({ ...merged.data, id: SETTINGS_ID })
}
