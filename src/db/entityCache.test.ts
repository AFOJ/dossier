import "fake-indexeddb/auto"
import { beforeEach, describe, expect, it } from "vitest"
import { db } from "@/db/db"
import { createCoverLetter, deleteCoverLetter, updateCoverLetter } from "@/db/coverLetter"
import {
  CACHE_TTL_MS,
  clearProcessedEntityCache,
  entryToBlob,
  getValidProcessedEntity,
  saveProcessedEntity,
} from "@/db/entityCache"
import { upsertProfile } from "@/db/profile"
import { createResume, deleteResume, updateResume } from "@/db/resume"

const PDF = () => new Blob(["%PDF-fake"], { type: "application/pdf" })

beforeEach(async () => {
  await db.profiles.clear()
  await db.resumes.clear()
  await db.coverLetters.clear()
  await db.entityCache.clear()
})

describe("entityCache", () => {
  it("round-trips a processed resume with its expiry", async () => {
    const id = await createResume("Frontend", [])
    const before = Date.now()

    await saveProcessedEntity({ entityType: "resume", entityId: id, blob: PDF() })

    const entry = await db.entityCache.get(`resume:${id}`)

    expect(entry?.contentType).toBe("application/pdf")
    expect(await entryToBlob(entry!).text()).toBe("%PDF-fake")
    expect(entry!.expiresAt.getTime() - entry!.processedAt.getTime()).toBe(CACHE_TTL_MS)
    expect(entry!.expiresAt.getTime()).toBeGreaterThanOrEqual(before + CACHE_TTL_MS)
  })

  it("keeps resume and cover letter cache entries separate", async () => {
    const resumeId = await createResume("Frontend", [])
    const letterId = await createCoverLetter({ title: "Acme", body: "<p>Hello</p>" })

    await saveProcessedEntity({ entityType: "resume", entityId: resumeId, blob: PDF() })
    await saveProcessedEntity({ entityType: "coverLetter", entityId: letterId, blob: PDF() })

    expect(await db.entityCache.get(`resume:${resumeId}`)).toBeDefined()
    expect(await db.entityCache.get(`coverLetter:${letterId}`)).toBeDefined()
    expect(await db.entityCache.get(`resume:${letterId}`)).toBeUndefined()
    expect(await db.entityCache.get(`coverLetter:${resumeId}`)).toBeUndefined()
  })

  it("serves fresh entries for an unchanged resume", async () => {
    const id = await createResume("Frontend", [])
    const resume = (await db.resumes.get(id))!

    await saveProcessedEntity({ entityType: "resume", entityId: id, blob: PDF() })

    const entry = await getValidProcessedEntity({
      entityType: "resume",
      entityId: id,
      entityUpdatedAt: resume.updatedAt,
    })

    expect(entry).toBeDefined()
    expect(await entryToBlob(entry!).text()).toBe("%PDF-fake")
  })

  it("serves fresh entries for an unchanged cover letter", async () => {
    const id = await createCoverLetter({ title: "Acme", body: "<p>Hello</p>" })
    const letter = (await db.coverLetters.get(id))!

    await saveProcessedEntity({ entityType: "coverLetter", entityId: id, blob: PDF() })

    const entry = await getValidProcessedEntity({
      entityType: "coverLetter",
      entityId: id,
      entityUpdatedAt: letter.updatedAt,
    })

    expect(entry).toBeDefined()
    expect(await entryToBlob(entry!).text()).toBe("%PDF-fake")
  })

  it("treats entries past their expiry as a miss and removes them", async () => {
    const id = await createResume("Frontend", [])
    const resume = (await db.resumes.get(id))!

    await saveProcessedEntity({
      entityType: "resume",
      entityId: id,
      blob: PDF(),
      processedAt: new Date(Date.now() - CACHE_TTL_MS - 1),
    })

    expect(
      await getValidProcessedEntity({
        entityType: "resume",
        entityId: id,
        entityUpdatedAt: resume.updatedAt,
      }),
    ).toBeNull()
    expect(await db.entityCache.get(`resume:${id}`)).toBeUndefined()
  })

  it("treats entries older than the entity update as stale", async () => {
    const id = await createResume("Frontend", [])

    await saveProcessedEntity({
      entityType: "resume",
      entityId: id,
      blob: PDF(),
      processedAt: new Date(Date.now() - 1000),
    })

    const futureUpdate = new Date(Date.now() + 1000)

    expect(
      await getValidProcessedEntity({
        entityType: "resume",
        entityId: id,
        entityUpdatedAt: futureUpdate,
      }),
    ).toBeNull()
    expect(await db.entityCache.get(`resume:${id}`)).toBeUndefined()
  })

  it("is invalidated immediately when the resume is updated", async () => {
    const id = await createResume("Frontend", [])

    await saveProcessedEntity({ entityType: "resume", entityId: id, blob: PDF() })
    expect(await db.entityCache.get(`resume:${id}`)).toBeDefined()

    await updateResume(id, { title: "Frontend (v2)" })

    expect(await db.entityCache.get(`resume:${id}`)).toBeUndefined()
  })

  it("is invalidated when the resume is deleted", async () => {
    const id = await createResume("Frontend", [])

    await saveProcessedEntity({ entityType: "resume", entityId: id, blob: PDF() })
    await deleteResume(id)

    expect(await db.entityCache.get(`resume:${id}`)).toBeUndefined()
  })

  it("is invalidated immediately when the cover letter is updated", async () => {
    const id = await createCoverLetter({ title: "Acme", body: "<p>Hello</p>" })

    await saveProcessedEntity({ entityType: "coverLetter", entityId: id, blob: PDF() })
    expect(await db.entityCache.get(`coverLetter:${id}`)).toBeDefined()

    await updateCoverLetter(id, { title: "Acme (v2)" })

    expect(await db.entityCache.get(`coverLetter:${id}`)).toBeUndefined()
  })

  it("is invalidated when the cover letter is deleted", async () => {
    const id = await createCoverLetter({ title: "Acme", body: "<p>Hello</p>" })

    await saveProcessedEntity({ entityType: "coverLetter", entityId: id, blob: PDF() })
    await deleteCoverLetter(id)

    expect(await db.entityCache.get(`coverLetter:${id}`)).toBeUndefined()
  })

  it("clearing a missing entry is a no-op", async () => {
    await expect(
      clearProcessedEntityCache({ entityType: "resume", entityId: "does-not-exist" }),
    ).resolves.toBeUndefined()
    await expect(
      clearProcessedEntityCache({ entityType: "coverLetter", entityId: "does-not-exist" }),
    ).resolves.toBeUndefined()
  })

  it("invalidates caches for synced entities when the profile is updated", async () => {
    await upsertProfile({
      full_name: "Jane Doe",
      role: "Engineer",
      email: null,
      phone: null,
      location: null,
      links: [],
    })

    const syncedResumeId = await createResume("Synced Resume", [])
    const unsyncedResumeId = await createResume("Unsynced Resume", [], { syncProfile: false })
    const syncedLetterId = await createCoverLetter({ title: "Synced Letter", body: "<p>Hi</p>" })
    const unsyncedLetterId = await createCoverLetter(
      { title: "Unsynced Letter", body: "<p>Hi</p>" },
      { syncProfile: false },
    )

    await saveProcessedEntity({ entityType: "resume", entityId: syncedResumeId, blob: PDF() })
    await saveProcessedEntity({ entityType: "resume", entityId: unsyncedResumeId, blob: PDF() })
    await saveProcessedEntity({ entityType: "coverLetter", entityId: syncedLetterId, blob: PDF() })
    await saveProcessedEntity({ entityType: "coverLetter", entityId: unsyncedLetterId, blob: PDF() })

    expect(await db.entityCache.count()).toBe(4)

    await upsertProfile({
      full_name: "Jane Doe",
      role: "Staff Engineer",
      email: "jane@example.com",
      phone: null,
      location: "Remote",
      links: [],
    })

    expect(await db.entityCache.get(`resume:${syncedResumeId}`)).toBeUndefined()
    expect(await db.entityCache.get(`coverLetter:${syncedLetterId}`)).toBeUndefined()
    expect(await db.entityCache.get(`resume:${unsyncedResumeId}`)).toBeDefined()
    expect(await db.entityCache.get(`coverLetter:${unsyncedLetterId}`)).toBeDefined()
  })
})