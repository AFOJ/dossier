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

  it("merges partial groups and writes only the canonical shape", async () => {
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
    expect(await db.settings.toArray()).toEqual([{ ...saved, id: SETTINGS_ID }])
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
