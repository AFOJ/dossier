import type { ZodType } from "zod"
import {
  db,
  type AppSettings,
  type AppearanceSettingsRow,
  type CoverLetterTitleSettingsRow,
} from "@/db/db"
import { appSettingsSchema } from "@/db/schemas"
import {
  DEFAULT_RESUME_TITLE_FORMAT,
  DEFAULT_EXPORT_FILENAME_FORMAT,
  DEFAULT_PDF_FILENAME_FORMAT_RESUME,
  DEFAULT_PDF_FILENAME_FORMAT_COVER_LETTER,
  DEFAULT_PDF_FILENAME_FORMAT_SHARED,
} from "@/lib/titleFormat"

export type Settings = Omit<AppSettings, "id">
export type ThemePreference = Settings["appearance"]["theme"]

export const SETTINGS_ID = "app"
export const COVER_LETTER_TITLE_SETTINGS_ID = "cover-letter-title"
export const APPEARANCE_SETTINGS_ID = "appearance"

export const DEFAULT_SETTINGS: Settings = {
  appearance: {
    theme: "system",
  },
  documents: {
    defaultSyncProfile: true,
    defaultResumeTitleFormat: DEFAULT_RESUME_TITLE_FORMAT,
    defaultCoverLetterTitleFormat: "",
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
  const appearance = asRecord(stored.appearance)
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
  const appearanceSchema = appSettingsSchema.shape.appearance.shape
  return {
    appearance: {
      theme: read(appearance, "theme", appearanceSchema.theme, DEFAULT_SETTINGS.appearance.theme),
    },
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
      defaultCoverLetterTitleFormat: read(
        documents,
        "defaultCoverLetterTitleFormat",
        documentSchema.defaultCoverLetterTitleFormat,
        DEFAULT_SETTINGS.documents.defaultCoverLetterTitleFormat,
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

async function readStoredSettings(): Promise<Settings> {
  const [row, titleRow, appearanceRow] = await Promise.all([
    db.settings.get(SETTINGS_ID),
    db.settings.get(COVER_LETTER_TITLE_SETTINGS_ID),
    db.settings.get(APPEARANCE_SETTINGS_ID),
  ])
  const settings = parseStoredSettings(row)
  const title = appSettingsSchema.shape.documents.shape.defaultCoverLetterTitleFormat.safeParse(
    asRecord(titleRow).defaultCoverLetterTitleFormat,
  )
  const appearance = appSettingsSchema.shape.appearance.safeParse(
    asRecord(appearanceRow).appearance,
  )
  return {
    ...settings,
    appearance: appearance.success ? appearance.data : settings.appearance,
    documents: {
      ...settings.documents,
      defaultCoverLetterTitleFormat: title.success
        ? title.data
        : settings.documents.defaultCoverLetterTitleFormat,
    },
  }
}

export async function getSettings(): Promise<Settings> {
  return readStoredSettings()
}

/** Older builds replace the app row, so keep this preference in a separate row too. */
export function coverLetterTitleSettingsRow(title: string): CoverLetterTitleSettingsRow {
  return { id: COVER_LETTER_TITLE_SETTINGS_ID, defaultCoverLetterTitleFormat: title }
}

/** Older builds replace the app row, so keep the theme in a separate row too. */
export function appearanceSettingsRow(appearance: Settings["appearance"]): AppearanceSettingsRow {
  return { id: APPEARANCE_SETTINGS_ID, appearance }
}

export type SettingsUpdate = {
  [Group in keyof Settings]?: Partial<Settings[Group]>
}

/** Flat aliases keep document settings readable across older builds and backups. */
export function toCompatibleSettings(settings: Settings) {
  return {
    ...settings,
    defaultSyncProfile: settings.documents.defaultSyncProfile,
    defaultResumeTitleFormat: settings.documents.defaultResumeTitleFormat,
    defaultCoverLetterTitleFormat: settings.documents.defaultCoverLetterTitleFormat,
    defaultExportFilenameFormat: settings.exports.defaultExportFilenameFormat,
    defaultResumePdfFilenameFormat: settings.exports.defaultResumePdfFilenameFormat,
    defaultCoverLetterPdfFilenameFormat: settings.exports.defaultCoverLetterPdfFilenameFormat,
    defaultPdfFilenameFormat: settings.exports.defaultPdfFilenameFormat,
    pdfFilenamePattern: settings.exports.pdfFilenamePattern,
  }
}

/** Merge within groups in one transaction so concurrent partial updates survive. */
export async function upsertSettings(data: SettingsUpdate): Promise<Settings> {
  return db.transaction("rw", db.settings, async () => {
    const current = await readStoredSettings()
    const merged = appSettingsSchema.safeParse({
      appearance: { ...current.appearance, ...data.appearance },
      documents: { ...current.documents, ...data.documents },
      exports: { ...current.exports, ...data.exports },
    })
    if (!merged.success) {
      throw new Error("Invalid app settings.")
    }
    await db.settings.bulkPut([
      { ...toCompatibleSettings(merged.data), id: SETTINGS_ID },
      coverLetterTitleSettingsRow(merged.data.documents.defaultCoverLetterTitleFormat),
      appearanceSettingsRow(merged.data.appearance),
    ])
    return merged.data
  })
}
