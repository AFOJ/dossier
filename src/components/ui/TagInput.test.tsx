import { useState } from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect } from "vitest"
import { TagInput } from "@/components/ui"

function Harness({
  initial = [],
  reorderable = false,
}: {
  initial?: string[]
  reorderable?: boolean
}) {
  const [tags, setTags] = useState(initial)
  return (
    <>
      <TagInput value={tags} onChange={setTags} reorderable={reorderable} ariaLabel="Tags" />
      <output>{JSON.stringify(tags)}</output>
    </>
  )
}

describe("shared TagInput", () => {
  it("keeps the existing add/remove behavior and hides reorder controls by default", async () => {
    const user = userEvent.setup()
    render(<Harness />)
    const input = screen.getByRole("textbox", { name: "Tags" })
    await user.type(input, "React{Enter}TypeScript,")
    expect(screen.getByRole("status")).toHaveTextContent('["React","TypeScript"]')
    expect(screen.queryByRole("button", { name: "Move React up" })).not.toBeInTheDocument()
    await user.type(input, "React{Enter}")
    expect(screen.getByRole("status")).toHaveTextContent('["React","TypeScript"]')
    await user.click(screen.getByRole("button", { name: "Remove React" }))
    await user.type(input, "{Backspace}")
    expect(screen.getByRole("status")).toHaveTextContent("[]")
  })

  it("preserves duplicate tags from older imports and removes only the selected occurrence", async () => {
    const user = userEvent.setup()
    render(<Harness initial={["React", "TypeScript", "React"]} reorderable />)
    await user.click(screen.getAllByRole("button", { name: "Move React up" })[1])
    expect(screen.getByRole("status")).toHaveTextContent('["React","React","TypeScript"]')
    await user.click(screen.getAllByRole("button", { name: "Remove React" })[0])
    expect(screen.getByRole("status")).toHaveTextContent('["React","TypeScript"]')
  })
})
