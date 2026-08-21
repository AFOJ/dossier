import 'fake-indexeddb/auto'
import { beforeEach, describe, it, expect } from 'vitest'
import { db } from '@/db/db'
import { buildExportData } from '@/db/export'

beforeEach(async () => {
  await db.profiles.clear()
  await db.resumes.clear()
})

describe('buildExportData', () => {
  it('includes the profile without its id and all resumes', async () => {
    await db.profiles.add({
      full_name: 'John Doe',
      role: 'Engineer',
      email: 'john@doe.com',
      phone: null,
      location: null,
      links: [{ label: 'GitHub', url: 'https://github.com/johndoe' }],
    })

    await db.resumes.bulkAdd([
      {
        id: crypto.randomUUID(),
        title: 'Resume 1',
        sections: [],
        createdAt: new Date('2026-01-01T10:00:00Z'),
        updatedAt: new Date('2026-01-01T10:00:00Z'),
      },
      {
        id: crypto.randomUUID(),
        title: 'Resume 2',
        sections: [{ type: 'summary', text: 'Hello' }],
        createdAt: new Date('2026-01-02T10:00:00Z'),
        updatedAt: new Date('2026-01-02T10:00:00Z'),
      },
    ])

    const data = await buildExportData()

    expect(data.version).toBe(1)
    expect(data.exportedAt).toEqual(expect.any(String))
    expect(data.profile).toEqual({
      full_name: 'John Doe',
      role: 'Engineer',
      email: 'john@doe.com',
      phone: null,
      location: null,
      links: [{ label: 'GitHub', url: 'https://github.com/johndoe' }],
    })
    expect(data.resumes.map((resume) => resume.title)).toEqual([
      'Resume 2',
      'Resume 1',
    ])
  })

  it('serializes to JSON with dates as ISO strings', async () => {
    await db.profiles.add({
      full_name: 'John Doe',
      role: null,
      email: null,
      phone: null,
      location: null,
      links: [],
    })

    await db.resumes.add({
      id: crypto.randomUUID(),
      title: 'My Resume',
      sections: [],
      createdAt: new Date('2026-03-04T05:06:07.000Z'),
      updatedAt: new Date('2026-03-04T05:06:07.000Z'),
    })

    const data = await buildExportData()
    const parsed = JSON.parse(JSON.stringify(data))

    expect(parsed.resumes[0].createdAt).toBe('2026-03-04T05:06:07.000Z')
    expect(typeof parsed.exportedAt).toBe('string')
  })

  it('throws when there is no profile', async () => {
    await expect(buildExportData()).rejects.toThrow(
      'No profile found to export.',
    )
  })
})
