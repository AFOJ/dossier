import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { TagCombobox } from "@/components/tags"
import { db } from "@/db/db"
import { createTag } from "@/db/tag"

beforeEach(async () => {
  await db.tags.clear()
})

describe("TagCombobox", () => {
  it("supports searchable multi-select assignment and removable chips", async () => {
    const remoteId = await createTag({ name: "Remote", colour: "#abc" })
    const onChange = vi.fn()
    const user = userEvent.setup()

    const { rerender } = render(
      <TagCombobox value={[]} onChange={onChange} ariaLabel="Document tags" />,
    )

    const input = await screen.findByRole("combobox", { name: "Document tags" })
    await user.click(input)
    await user.type(input, "rem")
    await user.click(await screen.findByRole("option", { name: "Remote" }))
    expect(onChange).toHaveBeenCalledWith([remoteId])

    rerender(<TagCombobox value={[remoteId]} onChange={onChange} ariaLabel="Document tags" />)
    await waitFor(() => expect(screen.getByText("Remote")).toBeInTheDocument())
    await user.click(screen.getByRole("button", { name: "Remove Remote" }))
    expect(onChange).toHaveBeenLastCalledWith([])
  })
})
