import type { ZodType } from "zod"
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
  documents: {
    defaultSyncProfile: true,
    defaultResumeTitleFormat: DEFAULT_RESUME_TITLE_FORMAT,
  },
  exports: {
    defaultExportFilenameFormat: DEFAULT_EXPORT_FILENAME_FORMAT,
    defaultResumePdfFilenameFormat: DEFAULT_PDF_FILENAME_FORMAT_RESUME,
    defaultCoverLetterPdfFilenameFormat: DEFAULT_PDF_FILENAME_FORMAT_COVER_LETTER,
    defaultPdfFilenameFormat: DEFAULT_PDF_FILENAME_FORMAT_SHARED,
    pdfFilenamePattern: "ad-hoc",
  },
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

/** Accept legacy flat settings and partial groups. A present grouped value takes
 * precedence; each invalid or missing value falls back independently. */
export function parseStoredSettings(row: unknown): Settings {
  const stored = asRecord(row)
  const documents = asRecord(stored.documents)
  const exports = asRecord(stored.exports)
  const read = <Value>(
    group: Record<string, unknown>,
    key: string,
    schema: ZodType<Value>,
    fallback: Value,
  ): Value => {
    const parsed = schema.safeParse(Object.hasOwn(group, key) ? group[key] : stored[key])
    return parsed.success ? parsed.data : fallback
  }
  const documentSchema = appSettingsSchema.shape.documents.shape
  const exportSchema = appSettingsSchema.shape.exports.shape
  return {
    documents: {
      defaultSyncProfile: read(
        documents,
        "defaultSyncProfile",
        documentSchema.defaultSyncProfile,
        DEFAULT_SETTINGS.documents.defaultSyncProfile,
      ),
      defaultResumeTitleFormat: read(
        documents,
        "defaultResumeTitleFormat",
        documentSchema.defaultResumeTitleFormat,
        DEFAULT_SETTINGS.documents.defaultResumeTitleFormat,
      ),
    },
    exports: {
      defaultExportFilenameFormat: read(
        exports,
        "defaultExportFilenameFormat",
        exportSchema.defaultExportFilenameFormat,
        DEFAULT_SETTINGS.exports.defaultExportFilenameFormat,
      ),
      defaultResumePdfFilenameFormat: read(
        exports,
        "defaultResumePdfFilenameFormat",
        exportSchema.defaultResumePdfFilenameFormat,
        DEFAULT_SETTINGS.exports.defaultResumePdfFilenameFormat,
      ),
      defaultCoverLetterPdfFilenameFormat: read(
        exports,
        "defaultCoverLetterPdfFilenameFormat",
        exportSchema.defaultCoverLetterPdfFilenameFormat,
        DEFAULT_SETTINGS.exports.defaultCoverLetterPdfFilenameFormat,
      ),
      defaultPdfFilenameFormat: read(
        exports,
        "defaultPdfFilenameFormat",
        exportSchema.defaultPdfFilenameFormat,
        DEFAULT_SETTINGS.exports.defaultPdfFilenameFormat,
      ),
      pdfFilenamePattern: read(
        exports,
        "pdfFilenamePattern",
        exportSchema.pdfFilenamePattern,
        DEFAULT_SETTINGS.exports.pdfFilenamePattern,
      ),
    },
  }
}

export async function getSettings(): Promise<Settings> {
  return parseStoredSettings(await db.settings.get(SETTINGS_ID))
}

export type SettingsUpdate = {
  [Group in keyof Settings]?: Partial<Settings[Group]>
}

/** Merge within groups in one transaction so concurrent partial updates survive. */
export async function upsertSettings(data: SettingsUpdate): Promise<void> {
  await db.transaction("rw", db.settings, async () => {
    const current = parseStoredSettings(await db.settings.get(SETTINGS_ID))
    const merged = appSettingsSchema.safeParse({
      documents: { ...current.documents, ...data.documents },
      exports: { ...current.exports, ...data.exports },
    })
    if (!merged.success) throw new Error("Invalid app settings.")
    await db.settings.put({ ...merged.data, id: SETTINGS_ID })
  })
}
