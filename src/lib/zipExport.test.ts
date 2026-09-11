import { describe, it, expect, vi, beforeEach } from "vitest"
import { unzip } from "fflate"
import { exportResumesAsZip } from "@/lib/zipExport"
import { downloadBlob } from "@/lib/download"
import type { Resume } from "@/db/db"

vi.mock("@/lib/download", () => ({
  downloadBlob: vi.fn(),
}))

const mockDownloadBlob = vi.mocked(downloadBlob)

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

async function readZipEntries(blob: Blob): Promise<Record<string, Uint8Array>> {
  const data = new Uint8Array(await blob.arrayBuffer())
  return new Promise((resolve, reject) => {
    unzip(data, (err, result) => {
      if (err) {
        reject(err)
        return
      }
      resolve(result as Record<string, Uint8Array>)
    })
  })
}

describe("exportResumesAsZip", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("downloads a single ZIP containing one JSON file per resume", async () => {
    await exportResumesAsZip([
      makeResume({ id: "a", title: "Frontend Engineer" }),
      makeResume({ id: "b", title: "Backend Engineer" }),
    ])

    expect(mockDownloadBlob).toHaveBeenCalledTimes(1)
    const [filename, blob] = mockDownloadBlob.mock.calls[0] as [string, Blob]
    expect(filename).toMatch(/^dossier-resumes-export-\d{4}-\d{2}-\d{2}\.zip$/)

    const entries = await readZipEntries(blob)
    expect(Object.keys(entries).sort()).toEqual([
      "backend-engineer-resume.json",
      "frontend-engineer-resume.json",
    ])

    const parsed = JSON.parse(new TextDecoder().decode(entries["frontend-engineer-resume.json"]))
    expect(parsed).toMatchObject({ id: "a", title: "Frontend Engineer" })
  })

  it("dedupes filenames when resume titles slug to the same value", async () => {
    await exportResumesAsZip([
      makeResume({ id: "a", title: "Same Title" }),
      makeResume({ id: "b", title: "Same Title" }),
      makeResume({ id: "c", title: "Same Title" }),
    ])

    const [, blob] = mockDownloadBlob.mock.calls[0] as [string, Blob]
    const entries = await readZipEntries(blob)
    expect(Object.keys(entries).sort()).toEqual([
      "same-title-resume-2.json",
      "same-title-resume-3.json",
      "same-title-resume.json",
    ])

    const ids = Object.values(entries).map(
      (bytes) => (JSON.parse(new TextDecoder().decode(bytes)) as { id: string }).id,
    )
    expect(ids.sort()).toEqual(["a", "b", "c"])
  })
})
