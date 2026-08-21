import 'fake-indexeddb/auto'
import {
  createResume,
  getResume,
  getAllResumes,
  queryResumes,
  updateResume,
  deleteResume,
} from '@/db/resume'
import { db } from '@/db/db'
import { describe, it, expect, beforeEach } from 'vitest'

const delay = (ms = 10) => new Promise((resolve) => setTimeout(resolve, ms))

beforeEach(async () => {
  await db.profiles.clear()
  await db.resumes.clear()
})

describe('Resume Service', () => {
  it('handles resume lifecycle, updates, and timestamps', async () => {
    const id = await createResume('Original', [
      { type: 'summary', text: 'Old' },
    ])
    const initial = await getResume(id)

    expect(initial).toBeDefined()
    expect(initial?.createdAt).toEqual(initial?.updatedAt)

    await delay(10)

    await updateResume(id, {
      title: 'Updated',
      sections: [{ type: 'summary', text: 'New' }],
    })
    const updated = await getResume(id)

    expect(updated?.title).toBe('Updated')
    expect(updated?.createdAt).toEqual(initial?.createdAt) // Unchanged
    expect(updated!.updatedAt.getTime()).toBeGreaterThan(
      initial!.updatedAt.getTime(),
    ) // Bumped

    await deleteResume(id)
    expect(await getResume(id)).toBeUndefined()
  })

  it('returns resumes sorted by latest updatedAt', async () => {
    await createResume('Resume 1', [])
    await delay(10)
    const targetId = await createResume('Resume 2', [])
    await delay(10)
    await createResume('Resume 3', [])
    await delay(10)

    await updateResume(targetId, { title: 'Resume 2 (Updated)' })

    const resumes = await getAllResumes()
    expect(resumes.map((r) => r.title)).toEqual([
      'Resume 2 (Updated)',
      'Resume 3',
      'Resume 1',
    ])
  })

  it('returns the effective pagination with its page slice', async () => {
    for (let index = 0; index < 5; index += 1) {
      await createResume(`Resume ${index}`, [])
      await delay(2)
    }

    const result = await queryResumes({ query: '', page: 99, perPage: 2 })

    expect(result.pagination).toMatchObject({
      page: 3,
      perPage: 2,
      totalCount: 5,
      totalPages: 3,
    })
    expect(result.items).toHaveLength(1)
  })
})
