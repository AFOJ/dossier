import { describe, it, expect, beforeEach } from 'vitest'
import 'fake-indexeddb/auto'
import { db, type Profile } from './db'
import { upsertProfile, getProfile, deleteProfile } from './profile'
import { createResume, getAllResumes } from './resume'

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
