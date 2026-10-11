import { describe, it, expect, vi, beforeEach } from "vitest"
import { unzip } from "fflate"
import { saveJsonAsZip } from "@/lib/zipExport"
import { downloadBlob } from "@/lib/download"

vi.mock("@/lib/download", () => ({
  downloadBlob: vi.fn(),
}))

const mockDownloadBlob = vi.mocked(downloadBlob)

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

describe("saveJsonAsZip", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("downloads a single ZIP holding one JSON file per entry", async () => {
    await saveJsonAsZip("resumes.zip", [
      { filename: "a.json", payload: { id: "a" } },
      { filename: "b.json", payload: { id: "b" } },
    ])

    expect(mockDownloadBlob).toHaveBeenCalledTimes(1)
    const [filename, blob] = mockDownloadBlob.mock.calls[0] as [string, Blob]
    expect(filename).toBe("resumes.zip")

    const entries = await readZipEntries(blob)
    expect(Object.keys(entries).sort()).toEqual(["a.json", "b.json"])
    expect(JSON.parse(new TextDecoder().decode(entries["a.json"]))).toEqual({ id: "a" })
  })

  it("dedupes filenames so each entry stays separately retrievable", async () => {
    await saveJsonAsZip("resumes.zip", [
      { filename: "same.json", payload: { id: "a" } },
      { filename: "same.json", payload: { id: "b" } },
      { filename: "same.json", payload: { id: "c" } },
    ])

    const [, blob] = mockDownloadBlob.mock.calls[0] as [string, Blob]
    const entries = await readZipEntries(blob)
    expect(Object.keys(entries).sort()).toEqual(["same-2.json", "same-3.json", "same.json"])

    const ids = Object.values(entries).map(
      (bytes) => (JSON.parse(new TextDecoder().decode(bytes)) as { id: string }).id,
    )
    expect(ids.sort()).toEqual(["a", "b", "c"])
  })

  it("formats the JSON so the archive is readable when unpacked", async () => {
    await saveJsonAsZip("resumes.zip", [{ filename: "a.json", payload: { id: "a", nested: [1] } }])

    const [, blob] = mockDownloadBlob.mock.calls[0] as [string, Blob]
    const entries = await readZipEntries(blob)
    expect(new TextDecoder().decode(entries["a.json"])).toBe(
      JSON.stringify({ id: "a", nested: [1] }, null, 2),
    )
  })
})
