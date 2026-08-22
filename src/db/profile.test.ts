import { describe, it, expect, beforeEach } from 'vitest'
import 'fake-indexeddb/auto'
import { db, type Profile } from '@/db/db'
import {
  upsertProfile,
  getProfile,
  deleteProfile,
  exportProfile,
  importProfile,
  InvalidExportFileError,
} from '@/db/profile'
import { createResume, getAllResumes } from '@/db/resume'

beforeEach(async () => {
  await db.profiles.clear()
  await db.resumes.clear()
})

const baseProfile: Profile = {
  full_name: 'John Doe',
  role: 'Teacher',
  phone: '123',
  location: null,
  email: null,
  links: [],
}

describe('Profile Service', () => {
  it('manages single-profile lifecycle (upsert and fetch)', async () => {
    expect(await getProfile()).toBeNull()

    // Create a new profile
    const id1 = await upsertProfile({
      ...baseProfile,
      full_name: 'John',
      phone: '123',
      links: [],
    })
    expect(await getProfile()).toMatchObject({
      full_name: 'John',
      links: [],
    })

    // Update the created profile
    const id2 = await upsertProfile({
      ...baseProfile,
      full_name: 'Jack',
      phone: '123',
      location: 'Remote',
      links: [{ label: 'portfolio', url: 'https://test.com' }],
    })
    expect(id1).toBe(id2)
    expect(await getProfile()).toMatchObject({
      full_name: 'Jack',
      location: 'Remote',
      links: [{ label: 'portfolio', url: 'https://test.com' }],
    })
  })

  it('cascades deletion to resumes', async () => {
    await upsertProfile({
      ...baseProfile,
      full_name: 'John',
      phone: '123',
      links: [],
    })
    await createResume('Resume 1', [])

    await deleteProfile()

    expect(await getProfile()).toBeNull()
    expect(await getAllResumes()).toEqual([])
  })
})

describe('exportProfile', () => {
  beforeEach(async () => {
    await db.profiles.clear()
    await db.resumes.clear()
  })

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
        sections: [{ type: 'paragraph', text: 'Hello' }],
        createdAt: new Date('2026-01-02T10:00:00Z'),
        updatedAt: new Date('2026-01-02T10:00:00Z'),
      },
    ])

    const data = await exportProfile()

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
    await upsertProfile({
      full_name: 'John Doe',
      role: null,
      email: null,
      phone: null,
      location: null,
      links: [],
    })

    const resume = await createResume('My Resume', [])
    await db.resumes.update(resume, {
      createdAt: new Date('2026-03-04T05:06:07.000Z'),
      updatedAt: new Date('2026-03-04T05:06:07.000Z'),
    })

    const data = await exportProfile()
    const parsed = JSON.parse(JSON.stringify(data))

    expect(parsed.resumes[0].createdAt).toBe('2026-03-04T05:06:07.000Z')
    expect(typeof parsed.exportedAt).toBe('string')
  })

  it('throws when there is no profile', async () => {
    await expect(exportProfile()).rejects.toThrow(
      'No profile found to export.',
    )
  })
})

describe('importProfile', () => {
  beforeEach(async () => {
    await db.profiles.clear()
    await db.resumes.clear()
  })

  const validExport = {
    version: 1,
    exportedAt: '2026-08-23T00:00:00.000Z',
    profile: {
      full_name: 'John Doe',
      role: 'Engineer',
      email: 'john@doe.com',
      phone: null,
      location: null,
      links: [{ label: 'GitHub', url: 'https://github.com/johndoe' }],
    },
    resumes: [
      {
        id: 'resume-1',
        title: 'My Resume',
        sections: [
          { type: 'paragraph', text: 'Hello' },
          {
            type: 'experience',
            companies: [
              {
                company_name: 'Acme',
                start_date: '2020-01',
                end_date: '2022-01',
                roles: [
                  {
                    job_title: 'Dev',
                    bullets: [
                      { type: 'text', text: 'Did things' },
                      {
                        type: 'text-with-title',
                        title: 'Stack',
                        text: 'React',
                      },
                    ],
                  },
                ],
              },
            ],
          },
          {
            type: 'skills',
            groups: [{ title: 'Frontend', items: ['React'] }],
          },
          {
            type: 'education',
            institutions: [
              {
                name: 'Uni',
                degree: 'BSc',
                start_date: '2015',
                end_date: '2019',
                location: 'London',
              },
            ],
          },
        ],
        createdAt: '2026-01-01T10:00:00.000Z',
        updatedAt: '2026-01-02T10:00:00.000Z',
      },
    ],
  }

  it('restores the profile and resumes from a valid export', async () => {
    await importProfile(JSON.stringify(validExport))

    const profile = await getProfile()
    expect(profile?.full_name).toBe('John Doe')
    expect(profile?.links).toEqual([
      { label: 'GitHub', url: 'https://github.com/johndoe' },
    ])

    const resumes = await db.resumes.toArray()
    expect(resumes).toHaveLength(1)

    const resume = resumes[0]
    expect(resume?.title).toBe('My Resume')
    expect(resume?.id).toBe('resume-1')
    expect(resume?.createdAt).toEqual(new Date('2026-01-01T10:00:00.000Z'))
    expect(resume?.updatedAt).toEqual(new Date('2026-01-02T10:00:00.000Z'))
  })

  it('generates ids for resumes missing one', async () => {
    const { resumes, ...rest } = validExport
    await importProfile(
      JSON.stringify({
        ...rest,
        resumes: [{ ...resumes[0], id: undefined }],
      }),
    )

    const restored = await db.resumes.toArray()
    expect(restored).toHaveLength(1)
    expect(restored[0]?.id).toEqual(expect.any(String))
  })

  it('rejects invalid JSON', async () => {
    await expect(importProfile('not json')).rejects.toThrow(
      InvalidExportFileError,
    )
  })

  it('rejects JSON that does not match the export schema', async () => {
    await expect(
      importProfile(JSON.stringify({ version: 1, nope: true })),
    ).rejects.toThrow(InvalidExportFileError)
  })

  it('rejects exports with unknown resume section types', async () => {
    const bad = {
      ...validExport,
      resumes: [
        {
          ...validExport.resumes[0],
          sections: [{ type: 'gallery', items: [] }],
        },
      ],
    }

    await expect(importProfile(JSON.stringify(bad))).rejects.toThrow(
      InvalidExportFileError,
    )
  })

  it('replaces existing resumes instead of merging with them', async () => {
    await db.profiles.add({
      full_name: 'Existing User',
      role: null,
      email: null,
      phone: null,
      location: null,
      links: [],
    })
    await db.resumes.add({
      id: 'stale-resume',
      title: 'Old Resume',
      sections: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const { resumes, ...rest } = validExport
    await importProfile(
      JSON.stringify({
        ...rest,
        resumes: resumes.filter((resume) => resume.id === 'resume-1'),
      }),
    )

    const restored = await db.resumes.toArray()
    expect(restored.map((resume) => resume.id)).toEqual(['resume-1'])
  })

  it('leaves the database untouched when validation fails', async () => {
    try {
      await importProfile(JSON.stringify({ version: 999 }))
    } catch {
      // expected
    }

    expect(await db.profiles.count()).toBe(0)
    expect(await db.resumes.count()).toBe(0)
  })
})
