import { act, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect } from "vitest"
import { useEffect, useState } from "react"
import { createMemoryRouter, Link, RouterProvider } from "react-router-dom"
import { ModalProvider } from "@/components/modal"
import { useUnsavedChangesWarning } from "@/hooks/useUnsavedChangesWarning"

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
      <Link to="/elsewhere">Elsewhere</Link>
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
      { path: "/elsewhere", element: <p>Elsewhere</p> },
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

async function goToElsewhere(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("link", { name: "Elsewhere" }))
}

describe("useUnsavedChangesWarning", () => {
  it("navigates freely while the form is clean", async () => {
    const user = userEvent.setup()
    renderProbe()

    expect(fireBeforeUnload().defaultPrevented).toBe(false)

    await goToElsewhere(user)

    expect(await screen.findByText("Elsewhere")).toBeInTheDocument()
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

    await goToElsewhere(user)

    expect(await screen.findByRole("dialog")).toHaveTextContent(/discard unsaved changes/i)
    expect(screen.getByText("Form")).toBeInTheDocument()
  })

  it("returns to the form and unblocks once the user stays", async () => {
    const user = userEvent.setup()
    const form = renderProbe()
    await form.setDirty(true)

    await goToElsewhere(user)
    await user.click(await screen.findByRole("button", { name: /stay on this page/i }))

    expect(await screen.findByText("Form")).toBeInTheDocument()
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()

    // Dismissing the dialog must not leave navigation permanently trapped.
    await goToElsewhere(user)

    expect(await screen.findByText("Elsewhere")).toBeInTheDocument()
  })

  it("navigates when the user discards their changes", async () => {
    const user = userEvent.setup()
    const form = renderProbe()
    await form.setDirty(true)

    await goToElsewhere(user)
    await user.click(await screen.findByRole("button", { name: /discard and leave/i }))

    expect(await screen.findByText("Elsewhere")).toBeInTheDocument()
  })

  it("stops guarding once the form goes clean again", async () => {
    const user = userEvent.setup()
    const form = renderProbe()
    await form.setDirty(true)
    expect(fireBeforeUnload().defaultPrevented).toBe(true)

    await form.setDirty(false)

    expect(fireBeforeUnload().defaultPrevented).toBe(false)
    await goToElsewhere(user)

    expect(await screen.findByText("Elsewhere")).toBeInTheDocument()
  })
})
