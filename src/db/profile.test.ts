import { describe, it, expect, beforeEach } from "vitest"
import "fake-indexeddb/auto"
import { db, type Profile } from "@/db/db"
import { createCoverLetter } from "@/db/coverLetter"
import { getValidProcessedEntity, saveProcessedEntity } from "@/db/entityCache"
import {
  upsertProfile,
  getProfile,
  deleteProfile,
  exportProfile,
  importProfile,
  InvalidExportFileError,
} from "@/db/profile"
import { createResume, getAllResumes } from "@/db/resume"

const PDF = () => new Blob(["%PDF-fake"], { type: "application/pdf" })

beforeEach(async () => {
  await db.profiles.clear()
  await db.resumes.clear()
  await db.coverLetters.clear()
  await db.entityCache.clear()
})

const baseProfile: Profile = {
  full_name: "John Doe",
  role: "Teacher",
  phone: "123",
  location: null,
  email: null,
  links: [],
}

describe("Profile Service", () => {
  it("manages single-profile lifecycle (upsert and fetch)", async () => {
    expect(await getProfile()).toBeNull()

    // Create a new profile
    const id1 = await upsertProfile({
      ...baseProfile,
      full_name: "John",
      phone: "123",
      links: [],
    })
    expect(await getProfile()).toMatchObject({
      full_name: "John",
      links: [],
    })

    // Update the created profile
    const id2 = await upsertProfile({
      ...baseProfile,
      full_name: "Jack",
      phone: "123",
      location: "Remote",
      links: [{ label: "portfolio", url: "https://test.com" }],
    })
    expect(id1).toBe(id2)
    expect(await getProfile()).toMatchObject({
      full_name: "Jack",
      location: "Remote",
      links: [{ label: "portfolio", url: "https://test.com" }],
    })
  })

  it("cascades deletion to resumes", async () => {
    await upsertProfile({
      ...baseProfile,
      full_name: "John",
      phone: "123",
      links: [],
    })
    await createResume("Resume 1", [])

    await deleteProfile()

    expect(await getProfile()).toBeNull()
    expect(await getAllResumes()).toEqual([])
  })

  it("clears the processed entity cache on deletion", async () => {
    await upsertProfile({
      ...baseProfile,
      full_name: "John",
      phone: "123",
      links: [],
    })
    const resumeId = await createResume("Resume 1", [])
    const letterId = await createCoverLetter({ title: "Letter 1", body: "<p>Hi</p>" })

    await saveProcessedEntity({ entityType: "resume", entityId: resumeId, blob: PDF() })
    await saveProcessedEntity({ entityType: "coverLetter", entityId: letterId, blob: PDF() })

    expect(await db.entityCache.count()).toBe(2)

    await deleteProfile()

    expect(await db.profiles.count()).toBe(0)
    expect(await db.resumes.count()).toBe(0)
    expect(await db.entityCache.count()).toBe(0)
  })
})

describe("exportProfile", () => {
  beforeEach(async () => {
    await db.profiles.clear()
    await db.resumes.clear()
  })

  it("includes the profile without its id and all resumes", async () => {
    await db.profiles.add({
      full_name: "John Doe",
      role: "Engineer",
      email: "john@doe.com",
      phone: null,
      location: null,
      links: [{ label: "GitHub", url: "https://github.com/johndoe" }],
    })

    await db.resumes.bulkAdd([
      {
        id: crypto.randomUUID(),
        title: "Resume 1",
        sections: [],
        createdAt: new Date("2026-01-01T10:00:00Z"),
        updatedAt: new Date("2026-01-01T10:00:00Z"),
      },
      {
        id: crypto.randomUUID(),
        title: "Resume 2",
        sections: [{ type: "paragraph", title: "Introduction", text: "Hello" }],
        createdAt: new Date("2026-01-02T10:00:00Z"),
        updatedAt: new Date("2026-01-02T10:00:00Z"),
      },
    ])

    const data = await exportProfile()

    expect(data.version).toBe(1)
    expect(data.exportedAt).toEqual(expect.any(String))
    expect(data.profile).toEqual({
      full_name: "John Doe",
      role: "Engineer",
      email: "john@doe.com",
      phone: null,
      location: null,
      links: [{ label: "GitHub", url: "https://github.com/johndoe" }],
    })
    expect(data.resumes.map((resume) => resume.title)).toEqual(["Resume 2", "Resume 1"])
  })

  it("includes all cover letters", async () => {
    await upsertProfile({ ...baseProfile, links: [] })

    await db.coverLetters.bulkAdd([
      {
        id: crypto.randomUUID(),
        title: "Letter 1",
        body: "<p>Hi</p>",
        createdAt: new Date("2026-01-01T10:00:00Z"),
        updatedAt: new Date("2026-01-01T10:00:00Z"),
        syncProfile: true,
        contact: null,
      },
      {
        id: crypto.randomUUID(),
        title: "Letter 2",
        subject: "Hello",
        body: "<p>Yo</p>",
        createdAt: new Date("2026-01-02T10:00:00Z"),
        updatedAt: new Date("2026-01-02T10:00:00Z"),
      },
    ])

    const data = await exportProfile()

    expect(data.coverLetters.map((letter) => letter.title)).toEqual(["Letter 2", "Letter 1"])
    expect(data.coverLetters[0]?.subject).toBe("Hello")
  })

  it("serializes to JSON with dates as ISO strings", async () => {
    await upsertProfile({
      full_name: "John Doe",
      role: null,
      email: null,
      phone: null,
      location: null,
      links: [],
    })

    const resume = await createResume("My Resume", [])
    await db.resumes.update(resume, {
      createdAt: new Date("2026-03-04T05:06:07.000Z"),
      updatedAt: new Date("2026-03-04T05:06:07.000Z"),
    })

    const letterId = await createCoverLetter({ title: "My Letter", body: "<p>Hello</p>" })
    await db.coverLetters.update(letterId, {
      createdAt: new Date("2026-03-04T05:06:07.000Z"),
      updatedAt: new Date("2026-03-04T05:06:07.000Z"),
    })

    const data = await exportProfile()
    const parsed = JSON.parse(JSON.stringify(data))

    expect(parsed.resumes[0].createdAt).toBe("2026-03-04T05:06:07.000Z")
    expect(parsed.coverLetters[0].createdAt).toBe("2026-03-04T05:06:07.000Z")
    expect(typeof parsed.exportedAt).toBe("string")
  })

  it("throws when there is no profile", async () => {
    await expect(exportProfile()).rejects.toThrow("No profile found to export.")
  })
})

describe("importProfile", () => {
  beforeEach(async () => {
    await db.profiles.clear()
    await db.resumes.clear()
  })

  const validExport = {
    version: 1,
    exportedAt: "2026-08-23T00:00:00.000Z",
    profile: {
      full_name: "John Doe",
      role: "Engineer",
      email: "john@doe.com",
      phone: null,
      location: null,
      links: [{ label: "GitHub", url: "https://github.com/johndoe" }],
    },
    resumes: [
      {
        id: "resume-1",
        title: "My Resume",
        sections: [
          { type: "paragraph", title: "Summary", text: "Hello" },
          {
            type: "experience",
            title: "Experience",
            companies: [
              {
                company_name: "Spotify",
                start_date: "2020-01",
                end_date: "2022-01",
                roles: [
                  {
                    job_title: "Dev",
                    bullets: [
                      { type: "text", text: "Did things" },
                      {
                        type: "text-with-title",
                        title: "Stack",
                        text: "React",
                      },
                    ],
                  },
                ],
              },
            ],
          },
          {
            type: "skills",
            title: "Skills",
            groups: [{ title: "Frontend", items: ["React"] }],
          },
          {
            type: "education",
            title: "Education",
            institutions: [
              {
                name: "Uni",
                degree: "BSc",
                start_date: "2015",
                end_date: "2019",
                location: "London",
              },
            ],
          },
        ],
        createdAt: "2026-01-01T10:00:00.000Z",
        updatedAt: "2026-01-02T10:00:00.000Z",
      },
    ],
  }

  it("restores the profile and resumes from a valid export", async () => {
    await importProfile(JSON.stringify(validExport))

    const profile = await getProfile()
    expect(profile?.full_name).toBe("John Doe")
    expect(profile?.links).toEqual([{ label: "GitHub", url: "https://github.com/johndoe" }])

    const resumes = await db.resumes.toArray()
    expect(resumes).toHaveLength(1)

    const resume = resumes[0]
    expect(resume?.title).toBe("My Resume")
    expect(resume?.id).toBe("resume-1")
    expect(resume?.createdAt).toEqual(new Date("2026-01-01T10:00:00.000Z"))
    expect(resume?.updatedAt).toEqual(new Date("2026-01-02T10:00:00.000Z"))
  })

  it("generates ids for resumes missing one", async () => {
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

  it("restores cover letters from a valid export", async () => {
    await importProfile(
      JSON.stringify({
        ...validExport,
        coverLetters: [
          {
            id: "letter-1",
            title: "My Letter",
            subject: "Hello",
            date: "2026-09-17",
            body: "<p>Dear team</p>",
            createdAt: "2026-01-03T10:00:00.000Z",
            updatedAt: "2026-01-04T10:00:00.000Z",
            syncProfile: true,
            contact: null,
          },
          {
            id: "letter-2",
            title: "Other Letter",
            body: "<p>Hi</p>",
            createdAt: "2026-01-05T10:00:00.000Z",
            updatedAt: "2026-01-05T10:00:00.000Z",
          },
        ],
      }),
    )

    const letters = await db.coverLetters.toArray()
    expect(letters).toHaveLength(2)

    const letter = letters.find((item) => item.id === "letter-1")
    expect(letter?.title).toBe("My Letter")
    expect(letter?.subject).toBe("Hello")
    expect(letter?.date).toBe("2026-09-17")
    expect(letter?.body).toBe("<p>Dear team</p>")
    expect(letter?.createdAt).toEqual(new Date("2026-01-03T10:00:00.000Z"))
    expect(letter?.updatedAt).toEqual(new Date("2026-01-04T10:00:00.000Z"))
    expect(letter?.contact).toBeNull()
    expect(letter?.syncProfile).toBe(true)

    const dateless = letters.find((item) => item.id === "letter-2")
    expect(dateless?.date).toBeNull()
  })

  it("generates ids for cover letters missing one", async () => {
    await importProfile(
      JSON.stringify({
        ...validExport,
        coverLetters: [
          {
            title: "My Letter",
            body: "<p>Hi</p>",
            createdAt: "2026-01-03T10:00:00.000Z",
            updatedAt: "2026-01-03T10:00:00.000Z",
          },
        ],
      }),
    )

    const restored = await db.coverLetters.toArray()
    expect(restored).toHaveLength(1)
    expect(restored[0]?.id).toEqual(expect.any(String))
  })

  it("replaces existing cover letters instead of merging with them", async () => {
    await db.coverLetters.add({
      id: "stale-letter",
      title: "Old Letter",
      body: "<p>Old</p>",
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    await importProfile(
      JSON.stringify({
        ...validExport,
        coverLetters: [
          {
            id: "letter-1",
            title: "My Letter",
            body: "<p>Hi</p>",
            createdAt: "2026-01-03T10:00:00.000Z",
            updatedAt: "2026-01-03T10:00:00.000Z",
          },
        ],
      }),
    )

    const restored = await db.coverLetters.toArray()
    expect(restored.map((letter) => letter.id)).toEqual(["letter-1"])
  })

  it("clears processed PDF caches so imported entities never reuse stale content", async () => {
    // An unsynced cover letter keeps its own cache entry after profile edits,
    // so its processed PDF can outlive the letter that produced it.
    await upsertProfile({ ...baseProfile, full_name: "John Doe", links: [] })
    const letterId = "letter-1"
    await createCoverLetter(
      { title: "Pre-import Letter", body: "<p>stale</p>" },
      {
        id: letterId,
        syncProfile: false,
        contact: {
          full_name: "John Doe",
          role: null,
          email: null,
          phone: null,
          location: null,
        },
      },
    )
    await saveProcessedEntity({
      entityType: "coverLetter",
      entityId: letterId,
      blob: PDF(),
      processedAt: new Date("2099-01-01T00:00:00.000Z"),
    })
    expect(await db.entityCache.count()).toBe(1)

    // The import replaces the letter with one that reuses the id and has an
    // older updatedAt, which previously made the stale PDF look "current".
    await importProfile(
      JSON.stringify({
        ...validExport,
        coverLetters: [
          {
            id: letterId,
            title: "Imported Letter",
            body: "<p>fresh</p>",
            createdAt: "2020-01-01T00:00:00.000Z",
            updatedAt: "2020-01-01T00:00:00.000Z",
          },
        ],
      }),
    )

    expect(await db.entityCache.count()).toBe(0)
    expect(
      await getValidProcessedEntity({
        entityType: "coverLetter",
        entityId: letterId,
        entityUpdatedAt: new Date("2020-01-01T00:00:00.000Z"),
      }),
    ).toBeNull()
  })

  it("imports exports written before cover letters were supported", async () => {
    // validExport predates the coverLetters field and has no such key.
    await importProfile(JSON.stringify(validExport))

    expect(await db.coverLetters.count()).toBe(0)
  })

  it("rejects invalid JSON", async () => {
    await expect(importProfile("not json")).rejects.toThrow(InvalidExportFileError)
  })

  it("rejects JSON that does not match the export schema", async () => {
    await expect(importProfile(JSON.stringify({ version: 1, nope: true }))).rejects.toThrow(
      InvalidExportFileError,
    )
  })

  it("rejects exports with unknown resume section types", async () => {
    const bad = {
      ...validExport,
      resumes: [
        {
          ...validExport.resumes[0],
          sections: [{ type: "gallery", items: [] }],
        },
      ],
    }

    await expect(importProfile(JSON.stringify(bad))).rejects.toThrow(InvalidExportFileError)
  })

  it("replaces existing resumes instead of merging with them", async () => {
    await db.profiles.add({
      full_name: "Existing User",
      role: null,
      email: null,
      phone: null,
      location: null,
      links: [],
    })
    await db.resumes.add({
      id: "stale-resume",
      title: "Old Resume",
      sections: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const { resumes, ...rest } = validExport
    await importProfile(
      JSON.stringify({
        ...rest,
        resumes: resumes.filter((resume) => resume.id === "resume-1"),
      }),
    )

    const restored = await db.resumes.toArray()
    expect(restored.map((resume) => resume.id)).toEqual(["resume-1"])
  })

  it("round-trips through delete: synced resumes and cover letters restore cleanly", async () => {
    await upsertProfile({
      ...baseProfile,
      full_name: "John Doe",
      links: [{ label: "GitHub", url: "https://github.com/johndoe" }],
    })
    // createResume defaults to syncProfile: true and contact: null.
    await createResume("Production Resume", [
      { type: "paragraph", title: "Summary", text: "Summary" },
    ])
    // createCoverLetter defaults to syncProfile: true and contact: null.
    await createCoverLetter({ title: "Production Letter", body: "<p>Hi</p>" })

    const exported = JSON.stringify(await exportProfile())

    await deleteProfile()
    expect(await getProfile()).toBeNull()
    expect(await getAllResumes()).toEqual([])

    await importProfile(exported)

    const profile = await getProfile()
    expect(profile?.full_name).toBe("John Doe")

    const resumes = await getAllResumes()
    expect(resumes.map((resume) => resume.title)).toEqual(["Production Resume"])
    expect(resumes[0]?.contact).toBeNull()
    expect(resumes[0]?.syncProfile).toBe(true)

    const letters = await db.coverLetters.toArray()
    expect(letters).toHaveLength(1)
    expect(letters[0]?.title).toBe("Production Letter")
    expect(letters[0]?.contact).toBeNull()
    expect(letters[0]?.syncProfile).toBe(true)
  })

  it("leaves the database untouched when validation fails", async () => {
    try {
      await importProfile(JSON.stringify({ version: 999 }))
    } catch {
      // expected
    }

    expect(await db.profiles.count()).toBe(0)
    expect(await db.resumes.count()).toBe(0)
  })
})
