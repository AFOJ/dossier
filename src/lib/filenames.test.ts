import { describe, expect, it } from "vitest"
import { sanitizeFilename, uniqueFilename, withExtension } from "@/lib/filenames"

describe("sanitizeFilename", () => {
  it("strips characters the filesystem rejects", () => {
    expect(sanitizeFilename('a<b>c:d"e\\f|g?h*i')).toBe("abcdefghi")
  })
})

describe("withExtension", () => {
  it("appends the extension when it is missing", () => {
    expect(withExtension("resume-export-10 Oct 2026", ".json")).toBe(
      "resume-export-10 Oct 2026.json",
    )
  })

  it("leaves a name that already has the extension", () => {
    expect(withExtension("resume-export.json", ".json")).toBe("resume-export.json")
  })

  it("ignores case when deciding whether to append", () => {
    expect(withExtension("resume.PDF", ".pdf")).toBe("resume.PDF")
    expect(withExtension("resume.pdf", ".pdf")).toBe("resume.pdf")
  })

  it("appends a different extension to a name ending in another", () => {
    expect(withExtension("resume.json", ".zip")).toBe("resume.json.zip")
  })
})

describe("uniqueFilename", () => {
  it("hands out the first name as-is", () => {
    expect(uniqueFilename(new Set(), "a.json")).toBe("a.json")
  })

  it("inserts a counter before the extension on a collision", () => {
    const taken = new Set<string>()

    expect(uniqueFilename(taken, "a.json")).toBe("a.json")
    expect(uniqueFilename(taken, "a.json")).toBe("a-2.json")
    expect(uniqueFilename(taken, "a.json")).toBe("a-3.json")
  })

  it("keeps counting past a name that was taken by hand", () => {
    const taken = new Set<string>(["a.json", "a-2.json"])

    expect(uniqueFilename(taken, "a.json")).toBe("a-3.json")
  })
})
