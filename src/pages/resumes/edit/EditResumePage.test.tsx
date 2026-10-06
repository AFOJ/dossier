import { act, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { createMemoryRouter, Link, RouterProvider } from "react-router-dom"
import EditResumePage from "@/pages/resumes/edit/EditResumePage"
import { updateResume } from "@/db/resume"
import type { Profile, Resume } from "@/db/db"
import { ModalProvider } from "@/components/modal"

vi.mock("@/db/resume", () => ({
  updateResume: vi.fn(),
}))

const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
}

vi.mock("@/components/toast", () => ({
  useToast: () => mockToast,
}))

function makeResume(): Resume {
  return {
    id: "resume-1",
    title: "My Resume",
    sections: [{ type: "paragraph", text: "Intro", title: "Summary" }],
    tagIds: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    syncProfile: true,
    contact: null,
  }
}

// A real profile, so contact fields have something to prefill from.
function makeProfile(): Profile {
  return {
    id: 1,
    full_name: "Jane Roe",
    role: "Farmer",
    email: "jane@example.com",
    phone: "555-0100",
    location: "Cornfield",
    links: [{ label: "GitHub", url: "https://github.com/jane" }],
  }
}

// The route loader resolves asynchronously; the default 1000ms findBy budget is
// tight when the whole suite runs in parallel.
const READY = { timeout: 5_000 }

function renderPage() {
  // The edit route is nested under "protected" in the real app, which is where
  // the page reads the profile from.
  const router = createMemoryRouter(
    [
      {
        id: "protected",
        path: "/",
        loader: () => ({ profile: makeProfile() }),
        children: [
          {
            id: "resume-edit",
            path: "/resumes/:resumeId/edit",
            loader: () => ({ resume: makeResume() }),
            element: (
              <ModalProvider>
                <EditResumePage />
                <Link to="/resumes">Leave</Link>
              </ModalProvider>
            ),
          },
        ],
      },
      { path: "/resumes", element: <div>Resumes list</div> },
    ],
    { initialEntries: ["/resumes/resume-1/edit"] },
  )

  return render(<RouterProvider router={router} />)
}

describe("EditResumePage submit bar", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("keeps every action present when the form is pristine", async () => {
    renderPage()

    // Nothing to undo, redo or discard, but the controls stay put.
    expect(await screen.findByRole("button", { name: "Undo" }, READY)).toBeDisabled()
    expect(screen.getByRole("button", { name: "Redo" })).toBeDisabled()
    expect(screen.getByRole("button", { name: /Discard changes/ })).toBeDisabled()
    expect(screen.getByRole("button", { name: /Save changes/ })).toBeDisabled()
  })

  it("enables discard once the form is edited, and restores the saved values", async () => {
    const user = userEvent.setup()
    renderPage()

    const title = await screen.findByLabelText(/^Title/, undefined, READY)
    await user.clear(title)
    await user.type(title, "Renamed")

    const discard = screen.getByRole("button", { name: /Discard changes/ })
    expect(discard).toBeEnabled()

    await user.click(discard)

    expect(screen.getByLabelText(/^Title/)).toHaveValue("My Resume")
    expect(screen.getByRole("button", { name: /Discard changes/ })).toBeDisabled()
  })

  it("explains the disabled discard state in its tooltip", async () => {
    const user = userEvent.setup()
    renderPage()

    await user.hover(await screen.findByRole("button", { name: /Discard changes/ }, READY))

    expect(await screen.findByText("No changes to discard", undefined, READY)).toBeInTheDocument()
  })

  it("undoes a deleted section from the edit page", async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(await screen.findByRole("button", { name: /^Remove .* section$/i }, READY))
    expect(screen.getByText(/No sections yet/i)).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Undo" }))

    expect(screen.getByLabelText(/^Paragraph/)).toHaveValue("Intro")
  })

  it("ignores the undo shortcut while a save is in flight", async () => {
    const user = userEvent.setup()
    let finishSave: (() => void) | undefined
    vi.mocked(updateResume).mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          finishSave = () => resolve()
        }),
    )

    renderPage()

    // Deleting the only section leaves a valid, dirty form with an undo entry.
    await user.click(await screen.findByRole("button", { name: /^Remove .* section$/i }, READY))
    expect(screen.getByText(/No sections yet/i)).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /Save changes/ }))
    expect(updateResume).toHaveBeenCalledTimes(1)

    await user.keyboard("{Control>}z{/Control}")

    // The in-flight save persists what was submitted, so the shortcut must not
    // change the form out from under it.
    expect(screen.getByText(/No sections yet/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Undo" })).toBeDisabled()

    await act(async () => {
      finishSave?.()
    })
  })

  it("prefills contact details from the active profile when sync is turned off", async () => {
    const user = userEvent.setup()
    renderPage()

    // makeResume() is synced with no stored contact, so revealing the fields
    // must fall back to the profile rather than leaving them blank.
    const syncSwitch = await screen.findByRole(
      "switch",
      { name: "Use my profile information" },
      READY,
    )
    expect(syncSwitch).toBeChecked()

    await user.click(syncSwitch)

    expect(await screen.findByLabelText(/Full name/i)).toHaveValue("Jane Roe")
    expect(screen.getByLabelText(/Job title/i)).toHaveValue("Farmer")
    expect(screen.getByLabelText(/Location/i)).toHaveValue("Cornfield")
    expect(screen.getByLabelText(/Phone/i)).toHaveValue("555-0100")
    expect(screen.getByLabelText(/Email/i)).toHaveValue("jane@example.com")
    expect(screen.getByPlaceholderText("Label (e.g. GitHub)")).toHaveValue("GitHub")
    expect(screen.getByPlaceholderText("URL")).toHaveValue("https://github.com/jane")
  })

  it("warns before navigating away with unsaved changes", async () => {
    const user = userEvent.setup()
    renderPage()

    const title = await screen.findByLabelText(/^Title/, undefined, READY)
    await user.clear(title)
    await user.type(title, "Renamed")

    await user.click(screen.getByRole("link", { name: "Leave" }))

    expect(await screen.findByRole("dialog")).toHaveTextContent(/discard unsaved changes/i)
    expect(screen.queryByText("Resumes list")).not.toBeInTheDocument()
    expect(screen.getByLabelText(/^Title/)).toHaveValue("Renamed")
  })

  it("discards changes and navigates when confirmed", async () => {
    const user = userEvent.setup()
    renderPage()

    const title = await screen.findByLabelText(/^Title/, undefined, READY)
    await user.clear(title)
    await user.type(title, "Renamed")

    await user.click(screen.getByRole("link", { name: "Leave" }))
    await user.click(await screen.findByRole("button", { name: /discard and leave/i }))

    expect(await screen.findByText("Resumes list")).toBeInTheDocument()
  })

  it("redirects after a save without prompting", async () => {
    const user = userEvent.setup()
    vi.mocked(updateResume).mockResolvedValueOnce(undefined)
    renderPage()

    const title = await screen.findByLabelText(/^Title/, undefined, READY)
    await user.clear(title)
    await user.type(title, "Renamed")

    await user.click(screen.getByRole("button", { name: /Save changes/ }))

    // A saved form has nothing left to discard, so the redirect must go through
    // silently rather than opening the prompt again.
    expect(await screen.findByText("Resumes list")).toBeInTheDocument()
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("navigates without warning when nothing has changed", async () => {
    const user = userEvent.setup()
    renderPage()

    await screen.findByLabelText(/^Title/, undefined, READY)
    await user.click(screen.getByRole("link", { name: "Leave" }))

    expect(await screen.findByText("Resumes list")).toBeInTheDocument()
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })
})
