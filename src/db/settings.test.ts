import "fake-indexeddb/auto"
import { beforeEach, describe, expect, it } from "vitest"
import { db, type AppSettings } from "@/db/db"
import { DEFAULT_SETTINGS, SETTINGS_ID, getSettings, upsertSettings } from "@/db/settings"

beforeEach(async () => {
  await db.settings.clear()
})

// Rows like these exist after a schema change: written by an older build, or by
// a hand-edited database. getSettings must survive all of them.
function writeRawRow(row: unknown) {
  return db.settings.put(row as AppSettings)
}

describe("getSettings", () => {
  it("returns the defaults when nothing has been saved", async () => {
    expect(await getSettings()).toEqual(DEFAULT_SETTINGS)
  })

  it("returns the saved settings", async () => {
    await upsertSettings({ defaultSyncProfile: false })

    expect(await getSettings()).toEqual({
      ...DEFAULT_SETTINGS,
      defaultSyncProfile: false,
    })
  })

  it("fills gaps in a row written before a setting existed", async () => {
    await writeRawRow({ id: SETTINGS_ID, defaultSyncProfile: false })

    expect(await getSettings()).toEqual({
      ...DEFAULT_SETTINGS,
      defaultSyncProfile: false,
    })
  })

  it("drops keys it does not recognise", async () => {
    await writeRawRow({ ...DEFAULT_SETTINGS, id: SETTINGS_ID, retiredOption: true })

    expect(await getSettings()).toEqual(DEFAULT_SETTINGS)
    expect(await getSettings()).not.toHaveProperty("retiredOption")
  })

  it("falls back to the defaults rather than propagating a corrupt value", async () => {
    await writeRawRow({
      id: SETTINGS_ID,
      defaultSyncProfile: "yes",
      defaultResumeTitleFormat: 42,
    })

    expect(await getSettings()).toEqual(DEFAULT_SETTINGS)
  })

  it("falls back to the defaults when the format is empty", async () => {
    await writeRawRow({ ...DEFAULT_SETTINGS, id: SETTINGS_ID, defaultResumeTitleFormat: "" })

    expect(await getSettings()).toEqual(DEFAULT_SETTINGS)
  })
})

describe("upsertSettings", () => {
  it("merges into the existing settings rather than replacing them", async () => {
    await upsertSettings({ defaultResumeTitleFormat: "{profile.name}" })
    await upsertSettings({ defaultSyncProfile: false })

    expect(await getSettings()).toEqual({
      defaultSyncProfile: false,
      defaultResumeTitleFormat: "{profile.name}",
      defaultExportFilenameFormat: DEFAULT_SETTINGS.defaultExportFilenameFormat,
    })
  })

  it("keeps a single row", async () => {
    await upsertSettings({ defaultSyncProfile: false })
    await upsertSettings({ defaultSyncProfile: true })

    expect(await db.settings.count()).toBe(1)
  })

  it("rejects a value the reader could not use", async () => {
    await expect(upsertSettings({ defaultResumeTitleFormat: "" })).rejects.toThrow(
      "Invalid app settings.",
    )

    // The rejected write must not have partially landed.
    expect(await getSettings()).toEqual(DEFAULT_SETTINGS)
  })
})
