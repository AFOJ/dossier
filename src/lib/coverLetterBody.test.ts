import { describe, it, expect } from "vitest"
import { isCoverLetterBodyEmpty, sanitizeCoverLetterBody } from "@/lib/coverLetterBody"

describe("isCoverLetterBodyEmpty", () => {
  it("treats empty markup as empty", () => {
    expect(isCoverLetterBodyEmpty("")).toBe(true)
    expect(isCoverLetterBodyEmpty("<p></p>")).toBe(true)
    expect(isCoverLetterBodyEmpty("<p><br></p>")).toBe(true)
    expect(isCoverLetterBodyEmpty("<p>&nbsp; </p>")).toBe(true)
  })

  it("treats text and links as content", () => {
    expect(isCoverLetterBodyEmpty("<p>Hello</p>")).toBe(false)
    expect(isCoverLetterBodyEmpty("<p><strong>Hi</strong></p>")).toBe(false)
    expect(isCoverLetterBodyEmpty('<p><a href="https://example.com"></a></p>')).toBe(false)
  })
})

describe("sanitizeCoverLetterBody", () => {
  it("keeps allowed marks and drops the rest", () => {
    const result = sanitizeCoverLetterBody(
      '<p class="x">Hi <strong>there</strong> <u>you</u> <a href="https://example.com" target="_blank">link</a></p><script>alert(1)</script><h1>Head</h1>',
    )
    expect(result).not.toContain("<script")
    expect(result).not.toContain("<h1")
    expect(result).not.toContain("target=")
    expect(result).not.toContain("class=")
    expect(result).toContain("<strong>there</strong>")
    expect(result).toContain("<u>you</u>")
    expect(result).toContain('<a href="https://example.com">link</a>')
    expect(result).toContain("Head")
  })

  it("drops unsafe link targets", () => {
    const result = sanitizeCoverLetterBody('<p><a href="javascript:alert(1)">x</a></p>')
    expect(result).not.toContain("javascript:")
    expect(result).toContain("<a>x</a>")
  })
})
