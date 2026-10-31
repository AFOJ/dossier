import { z } from "zod"
import { appSettingsSchema } from "@/db/schemas"
import "fake-indexeddb/auto"
import { beforeEach, describe, expect, it } from "vitest"
import { db, type AppSettings } from "@/db/db"
import {
  DEFAULT_SETTINGS,
  SETTINGS_ID,
  getSettings,
  parseStoredSettings,
  upsertSettings,
} from "@/db/settings"

beforeEach(async () => {
  await db.settings.clear()
})
function writeRawRow(row: unknown) {
  return db.settings.put(row as AppSettings)
}

// The pre-grouping schema reads only these seven flat fields and strips groups.
const legacySettingsSchema = z.object({
  ...appSettingsSchema.shape.documents.shape,
  ...appSettingsSchema.shape.exports.shape,
})

describe("settings compatibility", () => {
  it("provides fresh defaults for absent or malformed groups", () => {
    for (const row of [undefined, null, [], { documents: null, exports: [] }]) {
      expect(parseStoredSettings(row)).toEqual(DEFAULT_SETTINGS)
    }
    const first = parseStoredSettings(undefined)
    first.documents.defaultSyncProfile = false
    expect(parseStoredSettings(undefined)).toEqual(DEFAULT_SETTINGS)
  })

  it("reads legacy flat settings without losing valid values", async () => {
    await writeRawRow({
      id: SETTINGS_ID,
      defaultSyncProfile: false,
      defaultResumeTitleFormat: "{profile.name} CV",
      defaultExportFilenameFormat: "{title}.json",
      pdfFilenamePattern: "per-kind",
      defaultPdfFilenameFormat: "",
    })
    expect(await getSettings()).toEqual({
      documents: { defaultSyncProfile: false, defaultResumeTitleFormat: "{profile.name} CV" },
      exports: { ...DEFAULT_SETTINGS.exports, defaultExportFilenameFormat: "{title}.json" },
    })
  })

  it("prefers grouped values and defaults invalid fields independently", () => {
    expect(
      parseStoredSettings({
        defaultSyncProfile: true,
        defaultResumeTitleFormat: "Legacy",
        documents: { defaultSyncProfile: false, defaultResumeTitleFormat: "" },
        exports: { defaultExportFilenameFormat: "custom-{title}", pdfFilenamePattern: "retired" },
      }),
    ).toEqual({
      documents: { ...DEFAULT_SETTINGS.documents, defaultSyncProfile: false },
      exports: { ...DEFAULT_SETTINGS.exports, defaultExportFilenameFormat: "custom-{title}" },
    })
  })

  it("merges partial groups and mirrors the original fields for older builds", async () => {
    await writeRawRow({
      id: SETTINGS_ID,
      defaultSyncProfile: false,
      defaultResumeTitleFormat: "Legacy title",
    })
    await upsertSettings({ exports: { pdfFilenamePattern: "shared" } })
    await upsertSettings({ documents: { defaultResumeTitleFormat: "New title" } })
    const saved = await getSettings()
    expect(saved.documents).toEqual({
      defaultSyncProfile: false,
      defaultResumeTitleFormat: "New title",
    })
    expect(saved.exports).toEqual({ ...DEFAULT_SETTINGS.exports, pdfFilenamePattern: "shared" })
    const rows = await db.settings.toArray()
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({ ...saved, id: SETTINGS_ID })
    expect(legacySettingsSchema.parse(rows[0])).toEqual({ ...saved.documents, ...saved.exports })
  })

  it("keeps preferences when an older tab reads and replaces the settings row", async () => {
    await upsertSettings({
      documents: { defaultSyncProfile: false, defaultResumeTitleFormat: "My CV" },
      exports: { defaultExportFilenameFormat: "custom-{title}", pdfFilenamePattern: "shared" },
    })
    const legacy = legacySettingsSchema.parse(await db.settings.get(SETTINGS_ID))
    await writeRawRow({ ...legacy, defaultPdfFilenameFormat: "updated-{title}", id: SETTINGS_ID })
    const saved = await getSettings()
    expect(saved.documents).toEqual({
      defaultSyncProfile: false,
      defaultResumeTitleFormat: "My CV",
    })
    expect(saved.exports).toMatchObject({
      defaultExportFilenameFormat: "custom-{title}",
      pdfFilenamePattern: "shared",
      defaultPdfFilenameFormat: "updated-{title}",
    })
  })

  it("preserves concurrent updates to different fields within the same group", async () => {
    await Promise.all([
      upsertSettings({ documents: { defaultSyncProfile: false } }),
      upsertSettings({ documents: { defaultResumeTitleFormat: "{profile.name} CV" } }),
      upsertSettings({ exports: { defaultPdfFilenameFormat: "{title}-custom" } }),
    ])
    const saved = await getSettings()
    expect(saved.documents).toEqual({
      defaultSyncProfile: false,
      defaultResumeTitleFormat: "{profile.name} CV",
    })
    expect(saved.exports.defaultPdfFilenameFormat).toBe("{title}-custom")
  })

  it("rejects invalid updates without changing the saved settings", async () => {
    await upsertSettings({ documents: { defaultSyncProfile: false } })
    const saved = await getSettings()
    await expect(upsertSettings({ documents: { defaultResumeTitleFormat: "" } })).rejects.toThrow(
      "Invalid app settings.",
    )
    expect(await getSettings()).toEqual(saved)
  })
})
