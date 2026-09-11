import { describe, it, expect } from "vitest"
import { toResumeExportPayload } from "@/lib/resumeExport"
import type { Resume } from "@/db/db"

function makeResume(overrides: Partial<Resume> = {}): Resume {
  return {
    id: crypto.randomUUID(),
    title: "Untitled",
    sections: [],
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-02-01T00:00:00.000Z"),
    syncProfile: true,
    contact: null,
    ...overrides,
  }
}

describe("toResumeExportPayload", () => {
  it("trims the title and serializes dates to ISO strings", () => {
    const payload = toResumeExportPayload(makeResume({ title: "  Frontend Engineer  " }))

    expect(payload.title).toBe("Frontend Engineer")
    expect(payload.createdAt).toBe("2026-01-01T00:00:00.000Z")
    expect(payload.updatedAt).toBe("2026-02-01T00:00:00.000Z")
  })

  it("passes through id, sections, sync flag, and contact", () => {
    const sections = [{ type: "paragraph", title: "Hello", text: "World" }] as Resume["sections"]
    const contact = {
      full_name: "Jane Doe",
      role: null,
      email: "jane@example.com",
      phone: null,
      location: null,
      links: [],
    }

    const payload = toResumeExportPayload(
      makeResume({ id: "resume-1", sections, syncProfile: false, contact }),
    )

    expect(payload.id).toBe("resume-1")
    expect(payload.sections).toEqual(sections)
    expect(payload.syncProfile).toBe(false)
    expect(payload.contact).toEqual(contact)
  })
})
