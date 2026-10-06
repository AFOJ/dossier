import "fake-indexeddb/auto"
import { beforeEach, describe, expect, it } from "vitest"
import { db } from "@/db/db"
import { DEFAULT_SETTINGS, getSettings, replaceSettings, upsertSettings } from "@/db/settings"

beforeEach(async () => {
  await db.settings.clear()
})

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
})

describe("upsertSettings", () => {
  it("merges into the existing settings rather than replacing them", async () => {
    await upsertSettings({ defaultResumeTitleFormat: "{profile.name}" })
    await upsertSettings({ defaultSyncProfile: false })

    expect(await getSettings()).toEqual({
      defaultSyncProfile: false,
      defaultResumeTitleFormat: "{profile.name}",
    })
  })

  it("keeps a single row", async () => {
    await upsertSettings({ defaultSyncProfile: false })
    await upsertSettings({ defaultSyncProfile: true })

    expect(await db.settings.count()).toBe(1)
  })
})

describe("replaceSettings", () => {
  it("overwrites the stored settings", async () => {
    await upsertSettings({ defaultSyncProfile: false, defaultResumeTitleFormat: "Custom" })

    await replaceSettings({
      defaultSyncProfile: true,
      defaultResumeTitleFormat: "{date}",
    })

    expect(await getSettings()).toEqual({
      defaultSyncProfile: true,
      defaultResumeTitleFormat: "{date}",
    })
  })
})
