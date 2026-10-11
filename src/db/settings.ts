import { z } from "zod"
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
 * Read-path counterpart of `appSettingsSchema`.
 *
 * A stored row or an imported backup may predate a setting, or carry a value
 * that has since been retired — a row written while `pdfFilenamePattern` was
 * still `"per-kind"` must not make the whole row unusable. Each field therefore
 * falls back on its own, so one unrecognised value costs that setting only.
 */
const storedSettingsSchema = z.object({
  defaultSyncProfile: appSettingsSchema.shape.defaultSyncProfile.catch(
    DEFAULT_SETTINGS.defaultSyncProfile,
  ),
  defaultResumeTitleFormat: appSettingsSchema.shape.defaultResumeTitleFormat.catch(
    DEFAULT_SETTINGS.defaultResumeTitleFormat,
  ),
  defaultExportFilenameFormat: appSettingsSchema.shape.defaultExportFilenameFormat.catch(
    DEFAULT_SETTINGS.defaultExportFilenameFormat,
  ),
  defaultResumePdfFilenameFormat: appSettingsSchema.shape.defaultResumePdfFilenameFormat.catch(
    DEFAULT_SETTINGS.defaultResumePdfFilenameFormat,
  ),
  defaultCoverLetterPdfFilenameFormat:
    appSettingsSchema.shape.defaultCoverLetterPdfFilenameFormat.catch(
      DEFAULT_SETTINGS.defaultCoverLetterPdfFilenameFormat,
    ),
  defaultPdfFilenameFormat: appSettingsSchema.shape.defaultPdfFilenameFormat.catch(
    DEFAULT_SETTINGS.defaultPdfFilenameFormat,
  ),
  pdfFilenamePattern: appSettingsSchema.shape.pdfFilenamePattern.catch(
    DEFAULT_SETTINGS.pdfFilenamePattern,
  ),
})

export function parseStoredSettings(row: unknown): Settings {
  const parsed = storedSettingsSchema.safeParse(row)

  return parsed.success ? parsed.data : { ...DEFAULT_SETTINGS }
}

/**
 * Reads the app settings, falling back to the defaults when the row is missing,
 * incomplete, or corrupt. Callers never have to handle absence.
 */
export async function getSettings(): Promise<Settings> {
  return parseStoredSettings(await db.settings.get(SETTINGS_ID))
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
