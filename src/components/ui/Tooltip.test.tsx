import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"
import { Tooltip } from "@/components/ui/Tooltip"
import { Button } from "@/components/ui/Button"

function renderTooltip() {
  return render(
    <Tooltip content="Undo delete section">
      <span className="inline-block">
        <Button aria-label="Undo">x</Button>
      </span>
    </Tooltip>,
  )
}

describe("Tooltip", () => {
  it("reveals its content on hover", async () => {
    const user = userEvent.setup()
    renderTooltip()

    expect(screen.queryByText("Undo delete section")).not.toBeInTheDocument()

    await user.hover(screen.getByRole("button", { name: "Undo" }))

    expect(await screen.findByText("Undo delete section")).toBeInTheDocument()
  })

  // The submit bar is `fixed` with z-30, so a portalled tooltip without an
  // explicit z-index paints underneath it.
  it("stacks above the fixed submit bar", async () => {
    const user = userEvent.setup()
    renderTooltip()

    await user.hover(screen.getByRole("button", { name: "Undo" }))

    const popup = await screen.findByText("Undo delete section")
    const positioner = popup.parentElement

    expect(positioner).not.toBeNull()

    const match = /z-(\d+)/.exec(positioner?.className ?? "")

    expect(match, `expected a z-index class, got "${positioner?.className}"`).not.toBeNull()
    expect(Number(match?.[1])).toBeGreaterThan(30)
  })
})
