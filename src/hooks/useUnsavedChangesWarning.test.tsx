import { act, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect } from "vitest"
import { useEffect, useState } from "react"
import { createMemoryRouter, Link, RouterProvider } from "react-router-dom"
import { ModalProvider } from "@/components/modal"
import { useUnsavedChangesWarning } from "@/hooks/useUnsavedChangesWarning"
import { releaseUnsavedChangesGuard } from "@/lib/unsavedChangesGuard"

type DirtyController = {
  isDirty: () => boolean
  setDirty: (value: boolean) => Promise<void>
}

function Probe(props: Readonly<{ onReady: (controller: DirtyController) => void }>) {
  const [isDirty, setIsDirty] = useState(false)

  useEffect(() => {
    props.onReady({
      isDirty: () => isDirty,
      setDirty: async (value: boolean) => {
        await act(async () => {
          setIsDirty(value)
        })
      },
    })
  })

  useUnsavedChangesWarning(() => isDirty)

  return (
    <>
      <p>Form</p>
      <Link to="/elsewhere">Leave</Link>
    </>
  )
}

// Controls the mounted form. A second render() would leave the first tree in
// place, and it would go on guarding navigation.
function renderProbe() {
  let controller: DirtyController | undefined

  const router = createMemoryRouter(
    [
      {
        id: "root",
        path: "/",
        element: (
          <ModalProvider>
            <Probe onReady={(value) => (controller = value)} />
          </ModalProvider>
        ),
      },
      { path: "/elsewhere", element: <p>Destination page</p> },
    ],
    { initialEntries: ["/"] },
  )

  render(<RouterProvider router={router} />)

  return {
    isDirty: () => controller?.isDirty() ?? false,
    setDirty: async (value: boolean) => {
      await controller?.setDirty(value)
    },
  }
}

function fireBeforeUnload() {
  const event = new Event("beforeunload", { cancelable: true })
  window.dispatchEvent(event)
  return event
}

async function attemptNavigation(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("link", { name: "Leave" }))
}

/**
 * Asserts the destination actually rendered. Checking for the link's absence
 * matters as much as the destination's presence: the link is still on screen
 * when navigation is blocked, so its presence alone would pass either way.
 */
function expectNavigated() {
  expect(screen.getByText("Destination page")).toBeInTheDocument()
  expect(screen.queryByRole("link", { name: "Leave" })).not.toBeInTheDocument()
}

describe("useUnsavedChangesWarning", () => {
  it("navigates freely while the form is clean", async () => {
    const user = userEvent.setup()
    renderProbe()

    expect(fireBeforeUnload().defaultPrevented).toBe(false)

    await attemptNavigation(user)

    expect(await screen.findByText("Destination page")).toBeInTheDocument()
    expectNavigated()
  })

  it("triggers the browser unload prompt once the form is dirty", async () => {
    const form = renderProbe()
    expect(fireBeforeUnload().defaultPrevented).toBe(false)

    await form.setDirty(true)

    expect(fireBeforeUnload().defaultPrevented).toBe(true)
  })

  it("shows a dialog and holds the user on the form", async () => {
    const user = userEvent.setup()
    const form = renderProbe()
    await form.setDirty(true)

    await attemptNavigation(user)

    expect(await screen.findByRole("dialog")).toHaveTextContent(/discard unsaved changes/i)
    expect(screen.getByText("Form")).toBeInTheDocument()
  })

  it("lets an app-initiated redirect past the guard", async () => {
    const user = userEvent.setup()
    const form = renderProbe()
    await form.setDirty(true)

    // Mirrors a form hook redirecting after a successful save: the redirect
    // must not raise a prompt for changes that are already on disk.
    releaseUnsavedChangesGuard()
    await attemptNavigation(user)

    expect(await screen.findByText("Destination page")).toBeInTheDocument()
    expectNavigated()
  })

  it("keeps the dialog open when Escape is pressed, leaving the choice to the buttons", async () => {
    const user = userEvent.setup()
    const form = renderProbe()
    await form.setDirty(true)

    await attemptNavigation(user)
    await user.keyboard("{Escape}")

    // Escape must not strand a blocked navigation with nothing on screen.
    expect(screen.getByRole("dialog")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /stay on this page/i }))
    expect(await screen.findByText("Form")).toBeInTheDocument()
  })

  it("returns to the form and unblocks once the user stays", async () => {
    const user = userEvent.setup()
    const form = renderProbe()
    await form.setDirty(true)

    await attemptNavigation(user)
    await user.click(await screen.findByRole("button", { name: /stay on this page/i }))

    expect(await screen.findByText("Form")).toBeInTheDocument()
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()

    // The form is still dirty, so leaving again must prompt rather than slip
    // through: staying has to release the blocker without disarming the guard.
    await attemptNavigation(user)
    expect(await screen.findByRole("dialog")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /discard and leave/i }))
    expect(await screen.findByText("Destination page")).toBeInTheDocument()
    expectNavigated()
  })

  it("navigates when the user discards their changes", async () => {
    const user = userEvent.setup()
    const form = renderProbe()
    await form.setDirty(true)

    await attemptNavigation(user)
    await user.click(await screen.findByRole("button", { name: /discard and leave/i }))

    expect(await screen.findByText("Destination page")).toBeInTheDocument()
    expectNavigated()
  })

  it("stops guarding once the form goes clean again", async () => {
    const user = userEvent.setup()
    const form = renderProbe()
    await form.setDirty(true)
    expect(fireBeforeUnload().defaultPrevented).toBe(true)

    await form.setDirty(false)

    expect(fireBeforeUnload().defaultPrevented).toBe(false)
    await attemptNavigation(user)

    expect(await screen.findByText("Destination page")).toBeInTheDocument()
    expectNavigated()
  })
})
