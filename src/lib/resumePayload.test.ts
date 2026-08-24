import { describe, it, expect, beforeEach } from 'vitest'
import type { Resume } from '@/db/db'
import { upsertProfile } from '@/db/profile'
import { db } from '@/db/db'
import { toResumePayload } from '@/lib/resumePayload'

function makeResume(overrides: Partial<Resume> = {}): Resume {
  return {
    id: 'resume-1',
    title: '  Frontend Engineer  ',
    sections: [{ type: 'paragraph', text: 'Summary' }],
    contact: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-02'),
    syncProfile: true,
    ...overrides,
  }
}

beforeEach(async () => {
  await db.profiles.clear()
})

describe('toResumePayload', () => {
  it('strips local-only fields and trims the title', async () => {
    const payload = await toResumePayload(makeResume())

    expect(payload).toEqual({
      title: 'Frontend Engineer',
      sections: [{ type: 'paragraph', text: 'Summary' }],
    })
  })

  it('omits contact when there is nothing to resolve it from', async () => {
    const payload = await toResumePayload(makeResume({ contact: null }))

    expect(JSON.parse(JSON.stringify(payload)).contact).toBeUndefined()
  })

  it('uses the current profile as the contact when profile sync is on', async () => {
    await upsertProfile({
      full_name: 'Ada Lovelace',
      role: 'Engineer',
      email: null,
      phone: null,
      location: null,
      links: [{ label: 'GitHub', url: 'https://github.com/ada' }],
    })

    const payload = await toResumePayload(
      makeResume({
        syncProfile: true,
        contact: { full_name: 'Frozen Name', role: null, email: null, phone: null, location: null, links: [] },
      }),
    )

    expect(payload.contact).toEqual({
      full_name: 'Ada Lovelace',
      role: 'Engineer',
      links: [{ label: 'GitHub', url: 'https://github.com/ada' }],
    })
  })

  it('uses the stored contact when profile sync is off', async () => {
    await upsertProfile({
      full_name: 'Live Profile',
      role: null,
      email: null,
      phone: null,
      location: null,
      links: [],
    })

    const payload = await toResumePayload(
      makeResume({
        syncProfile: false,
        contact: {
          full_name: 'Frozen Name',
          role: null,
          email: null,
          phone: null,
          location: null,
          links: [],
        },
      }),
    )

    expect(payload.contact).toEqual({ full_name: 'Frozen Name' })
  })

  it('drops empty optional contact fields and blank links', async () => {
    const payload = await toResumePayload(
      makeResume({
        syncProfile: false,
        contact: {
          full_name: ' Ada Lovelace ',
          role: '',
          email: 'ada@example.com',
          phone: '   ',
          location: 'London',
          links: [
            { label: 'GitHub', url: 'https://github.com/ada' },
            { label: '', url: 'https://example.com' },
            { label: 'Site', url: '' },
          ],
        },
      }),
    )

    expect(payload.contact).toEqual({
      full_name: 'Ada Lovelace',
      email: 'ada@example.com',
      location: 'London',
      links: [{ label: 'GitHub', url: 'https://github.com/ada' }],
    })
  })

  it('preserves a section title provided at runtime', async () => {
    const payload = await toResumePayload(
      makeResume({
        sections: [
          { type: 'paragraph', title: 'About me', text: 'Hello' },
        ] as unknown as Resume['sections'],
      }),
    )

    expect(payload.sections[0]).toEqual({
      type: 'paragraph',
      title: 'About me',
      text: 'Hello',
    })
  })

  it('omits empty required-in-local-model institution fields', async () => {
    const payload = await toResumePayload(
      makeResume({
        sections: [
          {
            type: 'education',
            institutions: [
              {
                name: 'Uni of Lagos',
                degree: 'BSc Computer Science',
                grade: '',
                start_date: '',
                end_date: '',
                location: '',
              },
            ],
          },
        ],
      }),
    )

    const section = payload.sections[0] as Extract<
      (typeof payload.sections)[number],
      { type: 'education' }
    >

    // Empty strings must not reach the backend; optional fields are omitted.
    expect(JSON.parse(JSON.stringify(section))).toEqual({
      type: 'education',
      institutions: [
        {
          name: 'Uni of Lagos',
          degree: 'BSc Computer Science',
        },
      ],
    })
  })

  it('drops blank skill items and groups left without items', async () => {
    const payload = await toResumePayload(
      makeResume({
        sections: [
          {
            type: 'skills',
            groups: [
              { title: 'Languages', items: [' TypeScript ', '', 'Rust'] },
              { title: 'Empty group', items: ['', '   '] },
            ],
          },
        ],
      }),
    )

    expect(payload.sections[0]).toEqual({
      type: 'skills',
      groups: [{ title: 'Languages', items: ['TypeScript', 'Rust'] }],
    })
  })

  it('normalizes experience companies to the backend contract', async () => {
    const payload = await toResumePayload(
      makeResume({
        sections: [
          {
            type: 'experience',
            companies: [
              {
                company_name: ' Acme ',
                company_website: '  ',
                start_date: '2020-01-01',
                roles: [
                  {
                    job_title: 'Engineer',
                    employment_type: '',
                    location: undefined,
                    bullets: [
                      { type: 'text', text: 'Did things' },
                      {
                        type: 'text-with-title',
                        title: 'Scope',
                        text: 'Owned X',
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      }),
    )

    const company = (
      payload.sections[0] as Extract<
        (typeof payload.sections)[number],
        { type: 'experience' }
      >
    ).companies[0]

    expect(company.company_name).toBe('Acme')
    // Empty optionals are omitted; missing end date becomes null.
    expect(JSON.parse(JSON.stringify(company))).toEqual({
      company_name: 'Acme',
      start_date: '2020-01-01',
      end_date: null,
      roles: [
        {
          job_title: 'Engineer',
          bullets: [
            { type: 'text', text: 'Did things' },
            { type: 'text-with-title', title: 'Scope', text: 'Owned X' },
          ],
        },
      ],
    })
    expect(company.end_date).toBeNull()
  })

  it('keeps an existing company end_date value', async () => {
    const payload = await toResumePayload(
      makeResume({
        sections: [
          {
            type: 'experience',
            companies: [
              {
                company_name: 'Acme',
                start_date: '2020-01-01',
                end_date: '2022-06-30',
                roles: [],
              },
            ],
          },
        ],
      }),
    )

    const section = payload.sections[0] as Extract<
      (typeof payload.sections)[number],
      { type: 'experience' }
    >

    expect(section.companies[0].end_date).toBe('2022-06-30')
  })
})
