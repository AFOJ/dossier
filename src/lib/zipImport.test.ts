import { describe, it, expect } from "vitest"
import { zipSync } from "fflate"
import { extractResumeJsonFiles } from "@/lib/zipImport"

function makeZipFile(entries: Record<string, string | Uint8Array>): File {
  const data: Record<string, Uint8Array> = {}
  for (const [name, content] of Object.entries(entries)) {
    data[name] = typeof content === "string" ? new TextEncoder().encode(content) : content
  }
  const zipped = zipSync(data)
  return new File([zipped.buffer as ArrayBuffer], "export.zip", { type: "application/zip" })
}

const resumeJson = JSON.stringify({ title: "Engineer", sections: [] })

describe("extractResumeJsonFiles", () => {
  it("extracts JSON entries and reports skipped files", async () => {
    const file = makeZipFile({
      "a-resume.json": resumeJson,
      "notes.txt": "not a resume",
      "folder/": new Uint8Array(),
      "broken-resume.json": resumeJson,
    })

    const { entries, skipped } = await extractResumeJsonFiles(file)

    expect(entries.map((entry) => entry.name).sort()).toEqual([
      "a-resume.json",
      "broken-resume.json",
    ])
    expect(entries[0].text).toContain("Engineer")
    expect(skipped).toEqual([{ name: "notes.txt", reason: "Not a JSON file." }])
  })

  it("throws a readable error for corrupted archives", async () => {
    const file = new File(["definitely not a zip"], "export.zip", { type: "application/zip" })

    await expect(extractResumeJsonFiles(file)).rejects.toThrow("Could not read ZIP file.")
  })
})
