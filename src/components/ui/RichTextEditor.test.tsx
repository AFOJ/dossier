import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { RichTextEditor } from "@/components/ui/RichTextEditor"

describe("RichTextEditor", () => {
  it("registers each extension once and renders the toolbar", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {})
    try {
      render(<RichTextEditor value="" onChange={() => {}} placeholder="Write…" />)
    } finally {
      expect(
        warnSpy.mock.calls.some((call) => String(call[0]).includes("Duplicate extension names")),
      ).toBe(false)
      warnSpy.mockRestore()
    }
    expect(screen.getByLabelText("Cover letter body")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Bold" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Underline" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Add link" })).toBeInTheDocument()
  })

  it("reports typed text through onChange", async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()
    render(<RichTextEditor value="" onChange={handleChange} />)
    await user.click(screen.getByLabelText("Cover letter body"))
    await user.keyboard("Hello")
    expect(handleChange).toHaveBeenCalled()
    const lastHtml = handleChange.mock.calls[handleChange.mock.calls.length - 1][0] as string
    expect(lastHtml).toContain("Hello")
  })
})
