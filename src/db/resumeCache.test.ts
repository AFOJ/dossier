import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/db/db'
import { createResume, deleteResume, updateResume } from '@/db/resume'
import {
  clearProcessedResumeCache,
  entryToBlob,
  getValidProcessedResume,
  RESUME_CACHE_TTL_MS,
  saveProcessedResume,
} from '@/db/resumeCache'

const PDF = () => new Blob(['%PDF-fake'], { type: 'application/pdf' })

beforeEach(async () => {
  await db.profiles.clear()
  await db.resumes.clear()
  await db.resumeCache.clear()
})

describe('resumeCache', () => {
  it('round-trips a processed resume with its expiry', async () => {
    const id = await createResume('Frontend', [])
    const before = Date.now()

    await saveProcessedResume(id, PDF())

    const entry = await db.resumeCache.get(id)

    expect(entry?.contentType).toBe('application/pdf')
    expect(await entryToBlob(entry!).text()).toBe('%PDF-fake')
    expect(entry!.expiresAt.getTime() - entry!.processedAt.getTime()).toBe(
      RESUME_CACHE_TTL_MS,
    )
    expect(entry!.expiresAt.getTime()).toBeGreaterThanOrEqual(
      before + RESUME_CACHE_TTL_MS,
    )
  })

  it('serves fresh entries for an unchanged resume', async () => {
    const id = await createResume('Frontend', [])
    const resume = (await db.resumes.get(id))!

    await saveProcessedResume(id, PDF())

    const entry = await getValidProcessedResume(id, resume.updatedAt)

    expect(entry).toBeDefined()
    expect(await entryToBlob(entry!).text()).toBe('%PDF-fake')
  })

  it('treats entries past their expiry as a miss and removes them', async () => {
    const id = await createResume('Frontend', [])
    const resume = (await db.resumes.get(id))!

    await saveProcessedResume(id, PDF(), {
      processedAt: new Date(Date.now() - RESUME_CACHE_TTL_MS - 1),
    })

    expect(await getValidProcessedResume(id, resume.updatedAt)).toBeUndefined()
    expect(await db.resumeCache.get(id)).toBeUndefined()
  })

  it('treats entries older than the resume update as stale', async () => {
    const id = await createResume('Frontend', [])

    await saveProcessedResume(id, PDF(), {
      processedAt: new Date(Date.now() - 1000),
    })

    // The resume changed after the cached copy was processed.
    const futureUpdate = new Date(Date.now() + 1000)

    expect(await getValidProcessedResume(id, futureUpdate)).toBeUndefined()
    expect(await db.resumeCache.get(id)).toBeUndefined()
  })

  it('is invalidated immediately when the resume is updated', async () => {
    const id = await createResume('Frontend', [])

    await saveProcessedResume(id, PDF())
    expect(await db.resumeCache.get(id)).toBeDefined()

    await updateResume(id, { title: 'Frontend (v2)' })

    expect(await db.resumeCache.get(id)).toBeUndefined()
  })

  it('is invalidated when the resume is deleted', async () => {
    const id = await createResume('Frontend', [])

    await saveProcessedResume(id, PDF())
    await deleteResume(id)

    expect(await db.resumeCache.get(id)).toBeUndefined()
  })

  it('clearing a missing entry is a no-op', async () => {
    await expect(
      clearProcessedResumeCache('does-not-exist'),
    ).resolves.toBeUndefined()
  })
})
