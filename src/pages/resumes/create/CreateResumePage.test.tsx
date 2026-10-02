import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { createMemoryRouter, RouterProvider } from "react-router-dom"
import CreateResumePage from "@/pages/resumes/create/CreateResumePage"
import useProtectedRouteData from "@/hooks/useProtectedRouteData"
import { createResume } from "@/db/resume"
import type { Profile } from "@/db/db"
import { ModalProvider } from "@/components/modal"

vi.mock("@/db/resume", () => ({
  createResume: vi.fn(),
}))

vi.mock("@/hooks/useProtectedRouteData", () => ({
  default: vi.fn(),
}))

const mockUseProtectedRouteData = vi.mocked(useProtectedRouteData)

const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
}

vi.mock("@/components/toast", () => ({
  useToast: () => mockToast,
}))

const profile: Profile = {
  id: 1,
  full_name: "John Doe",
  role: null,
  email: null,
  phone: null,
  location: null,
  links: [],
}

function renderPage() {
  const router = createMemoryRouter(
    [
      {
        path: "/resumes/create",
        element: (
          <ModalProvider>
            <CreateResumePage />
          </ModalProvider>
        ),
      },
      { path: "/resumes", element: <div>Resumes list</div> },
    ],
    { initialEntries: ["/resumes/create"] },
  )

  return render(<RouterProvider router={router} />)
}

async function addSectionViaMenu(user: ReturnType<typeof userEvent.setup>, label: string) {
  await user.click(screen.getByRole("button", { name: /^Add section$/i }))
  await user.click(await screen.findByRole("menuitem", { name: new RegExp(`^${label}`) }))
}

describe("CreateResumePage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseProtectedRouteData.mockReturnValue({ profile })
    vi.spyOn(console, "error").mockImplementation(() => {})
  })

  it("shows the empty state before any section is added", () => {
    renderPage()

    expect(screen.getByText(/No sections yet/i)).toBeInTheDocument()
  })

  it("prefills contact details from the profile and reveals them when unsynced", async () => {
    const user = userEvent.setup()
    renderPage()

    const syncSwitch = screen.getByRole("switch", {
      name: "Use my profile information",
    })
    expect(syncSwitch).toBeChecked()

    await user.click(syncSwitch)

    expect(syncSwitch).not.toBeChecked()
    const fullName = screen.getByLabelText(/Full name/i)
    expect(fullName).toHaveValue("John Doe")
    expect(screen.getByPlaceholderText("Farmer")).toBeInTheDocument()
  })

  it("adds and edits a paragraph section via the add-section menu, then creates the resume", async () => {
    const user = userEvent.setup()
    vi.mocked(createResume).mockResolvedValueOnce("resume-1")
    renderPage()

    await addSectionViaMenu(user, "Paragraph")

    const sectionTitle = screen.getByLabelText(/^Section title/)
    await user.type(sectionTitle, "Summary")

    const paragraph = screen.getByRole("textbox", { name: "Summary text" })
    await user.type(paragraph, "Seasoned engineer.")

    await user.type(screen.getByLabelText(/^Title/), "My Resume")
    await user.click(screen.getByRole("button", { name: "Create resume" }))

    await waitFor(() => {
      expect(createResume).toHaveBeenCalledWith(
        "My Resume",
        [{ type: "paragraph", text: "Seasoned engineer.", title: "Summary" }],
        { tagIds: [], syncProfile: true, contact: null },
      )
    })
    expect(await screen.findByText("Resumes list")).toBeInTheDocument()
  })

  it("lets the company switch be toggled off and back on beside the end date", async () => {
    const user = userEvent.setup()
    renderPage()

    await addSectionViaMenu(user, "Experience")

    const currentSwitch = screen.getByRole("switch", {
      name: "I currently work here",
    })
    expect(currentSwitch).toBeChecked()

    const endInput = screen.getByLabelText(/^End date/)
    expect(endInput).toBeDisabled()

    await user.click(currentSwitch)

    expect(currentSwitch).not.toBeChecked()
    expect(endInput).not.toBeDisabled()
    expect(endInput).toHaveValue("")

    await user.click(currentSwitch)

    expect(currentSwitch).toBeChecked()
    expect(endInput).toBeDisabled()
  })

  it("gives each role its own current-work switch", async () => {
    const user = userEvent.setup()
    renderPage()

    await addSectionViaMenu(user, "Experience")
    await user.click(screen.getByRole("button", { name: /Add role/i }))

    const switches = screen.getAllByRole("switch", {
      name: "I currently work here",
    })
    expect(switches).toHaveLength(2)
    expect(switches[0]).toBeChecked()
    expect(switches[1]).not.toBeChecked()

    const endInputs = screen.getAllByLabelText(/^End date/)
    expect(endInputs[0]).toBeDisabled()
    expect(endInputs[1]).not.toBeDisabled()

    await user.click(switches[1])

    expect(switches[1]).toBeChecked()
    expect(endInputs[1]).toBeDisabled()
  })

  it("blocks submission without a title", async () => {
    const user = userEvent.setup()
    renderPage()

    await addSectionViaMenu(user, "Paragraph")
    const paragraph = screen.getByRole("textbox", { name: "Untitled Section (Paragraph) text" })
    await user.type(paragraph, "Some text")

    await user.click(screen.getByRole("button", { name: "Create resume" }))

    // Find the error message for the resume title (inputId="resume-title"), not the section title
    const resumeTitleInput = screen.getByRole("textbox", { name: "Title *" })
    const describedBy = resumeTitleInput.getAttribute("aria-describedby") || ""
    const resumeTitleError = await screen.findByText("Title is required", {
      selector: describedBy
        .split(" ")
        .map((id) => `[id="${id}"]`)
        .join(","),
    })
    expect(resumeTitleError).toBeInTheDocument()
    expect(createResume).not.toHaveBeenCalled()
  })

  it("expands a collapsed section that fails validation on submit", async () => {
    const user = userEvent.setup()
    renderPage()

    await addSectionViaMenu(user, "Paragraph")
    await user.type(
      screen.getByRole("textbox", { name: "Untitled Section (Paragraph) text" }),
      "Hello",
    )

    await user.click(
      screen.getByRole("button", { name: "Collapse Untitled Section (Paragraph) section" }),
    )
    expect(screen.getByLabelText(/^Section title/)).not.toBeVisible()

    await user.type(screen.getByLabelText(/^Title/), "My Resume")
    await user.click(screen.getByRole("button", { name: "Create resume" }))

    await waitFor(() => {
      expect(screen.getByLabelText(/^Section title/)).toBeVisible()
    })
    expect(createResume).not.toHaveBeenCalled()
  })
})

describe("adding content focuses the first field", () => {
  it("focuses the section title input when a new section is added", async () => {
    const user = userEvent.setup()
    renderPage()

    await addSectionViaMenu(user, "Paragraph")

    expect(screen.getByLabelText(/^Section title/)).toHaveFocus()
  })

  it("focuses the new company name when a company is added", async () => {
    const user = userEvent.setup()
    renderPage()

    await addSectionViaMenu(user, "Experience")
    await user.click(screen.getByRole("button", { name: "Add company" }))

    const companies = screen.getAllByLabelText(/^Company/)
    expect(companies[companies.length - 1]).toHaveFocus()
  })

  it("focuses the new job title when a role is added", async () => {
    const user = userEvent.setup()
    renderPage()

    await addSectionViaMenu(user, "Experience")
    await user.click(screen.getByRole("button", { name: "Add role" }))

    const titles = screen.getAllByLabelText(/^Job title/)
    expect(titles[titles.length - 1]).toHaveFocus()
  })

  it("focuses the new bullet text when a simple bullet is added", async () => {
    const user = userEvent.setup()
    renderPage()

    await addSectionViaMenu(user, "Experience")
    await user.click(screen.getByRole("button", { name: "Add role" }))
    await user.click(screen.getByRole("button", { name: "Add bullet" }))
    await user.click(await screen.findByRole("menuitem", { name: /Simple bullet/ }))

    expect(screen.getByRole("textbox", { name: "Untitled Role bullet 1" })).toHaveFocus()
  })

  it("focuses the new bullet heading when a titled bullet is added", async () => {
    const user = userEvent.setup()
    renderPage()

    await addSectionViaMenu(user, "Experience")
    await user.click(screen.getByRole("button", { name: "Add role" }))
    await user.click(screen.getByRole("button", { name: "Add bullet" }))
    await user.click(await screen.findByRole("menuitem", { name: /Titled bullet/ }))

    expect(screen.getByRole("textbox", { name: /^Heading/ })).toHaveFocus()
  })

  it("keeps every nested list field focused while typing", async () => {
    const user = userEvent.setup()
    renderPage()

    await addSectionViaMenu(user, "Experience")
    await addSectionViaMenu(user, "Education")
    await addSectionViaMenu(user, "Skills")
    await addSectionViaMenu(user, "List")

    await user.click(screen.getByRole("button", { name: "Add role" }))
    await user.click(screen.getByRole("button", { name: "Add bullet" }))
    await user.click(await screen.findByRole("menuitem", { name: /Simple bullet/ }))
    await user.click(screen.getByRole("button", { name: "Add school" }))

    const last = (items: HTMLElement[]) => items[items.length - 1]

    // Every editor below funnels through `updateSection`, so one pass over all of
    // them covers each place a dropped `_key` would remount the row being edited.
    // A single character is enough: a lost key remounts the row on the first
    // keystroke, and it keeps the test cheap enough to stay stable in a full run.
    const cases = [
      { name: "bullet text", field: () => screen.getByRole("textbox", { name: /bullet 1$/ }) },
      { name: "company", field: () => last(screen.getAllByLabelText(/^Company/)) },
      { name: "role job title", field: () => last(screen.getAllByLabelText(/^Job title/)) },
      { name: "school", field: () => last(screen.getAllByLabelText(/^School/)) },
      { name: "skill group title", field: () => last(screen.getAllByLabelText(/^Group title/)) },
      {
        name: "list item title",
        field: () => last(screen.getAllByPlaceholderText("Project name")),
      },
    ]

    for (const { name, field } of cases) {
      const element = field()

      await user.type(element, "X")

      // waitFor lets React commit before we inspect; a dropped key remounts the
      // row asynchronously. Soft assertions keep one broken editor from masking
      // the rest.
      await waitFor(() => {
        expect.soft(element, `${name} lost its typed value`).toHaveValue("X")
        expect.soft(field(), `${name} was remounted mid-typing`).toBe(element)
        expect.soft(document.activeElement, `${name} lost focus mid-typing`).toBe(element)
      })
    }
  })

  it("focuses the new school name when a school is added", async () => {
    const user = userEvent.setup()
    renderPage()

    await addSectionViaMenu(user, "Education")
    await user.click(screen.getByRole("button", { name: "Add school" }))

    expect(screen.getByLabelText(/^School/)).toHaveFocus()
  })

  it("focuses the new group title when a skill group is added", async () => {
    const user = userEvent.setup()
    renderPage()

    await addSectionViaMenu(user, "Skills")
    await user.click(screen.getByRole("button", { name: "Add skill group" }))

    const titles = screen.getAllByLabelText(/^Group title/)
    expect(titles[titles.length - 1]).toHaveFocus()
  })

  it("focuses the new item title when a list item is added", async () => {
    const user = userEvent.setup()
    renderPage()

    await addSectionViaMenu(user, "List")
    await user.click(screen.getByRole("button", { name: "Add item" }))

    const titles = screen.getAllByPlaceholderText("Project name")
    expect(titles[titles.length - 1]).toHaveFocus()
  })
})

describe("undoing structural changes", () => {
  async function addParagraphWithText(user: ReturnType<typeof userEvent.setup>, text: string) {
    await addSectionViaMenu(user, "Paragraph")
    await user.type(screen.getByLabelText(/^Paragraph/), text)
  }

  async function deleteOnlySection(user: ReturnType<typeof userEvent.setup>) {
    await user.click(screen.getByRole("button", { name: /^Remove .* section$/i }))
  }

  it("restores a deleted section, content and all", async () => {
    const user = userEvent.setup()
    renderPage()

    await addParagraphWithText(user, "A long summary of my work.")
    await deleteOnlySection(user)

    expect(screen.getByText(/No sections yet/i)).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Undo" }))

    expect(screen.getByLabelText(/^Paragraph/)).toHaveValue("A long summary of my work.")
    expect(screen.queryByText(/No sections yet/i)).not.toBeInTheDocument()
  })

  it("re-applies a delete on redo", async () => {
    const user = userEvent.setup()
    renderPage()

    await addParagraphWithText(user, "Temporary")
    await deleteOnlySection(user)
    await user.click(screen.getByRole("button", { name: "Undo" }))

    await user.click(screen.getByRole("button", { name: "Redo" }))

    expect(screen.getByText(/No sections yet/i)).toBeInTheDocument()
  })

  it("undoes more than one action in reverse order", async () => {
    const user = userEvent.setup()
    renderPage()

    await addSectionViaMenu(user, "Paragraph")
    await addSectionViaMenu(user, "Experience")
    expect(screen.getAllByLabelText(/^Section title/)).toHaveLength(2)

    await user.click(screen.getByRole("button", { name: "Undo" }))
    expect(screen.getAllByLabelText(/^Section title/)).toHaveLength(1)

    await user.click(screen.getByRole("button", { name: "Undo" }))
    expect(screen.getByText(/No sections yet/i)).toBeInTheDocument()
  })

  it("keeps the history buttons present but disabled with an empty history", async () => {
    const user = userEvent.setup()
    renderPage()

    expect(screen.getByRole("button", { name: "Undo" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Redo" })).toBeDisabled()

    await addSectionViaMenu(user, "Paragraph")

    expect(screen.getByRole("button", { name: "Undo" })).toBeEnabled()
    expect(screen.getByRole("button", { name: "Redo" })).toBeDisabled()
  })

  it("shows the undo tooltip when there is something to undo", async () => {
    const user = userEvent.setup()
    renderPage()

    await addSectionViaMenu(user, "Paragraph")
    await deleteOnlySection(user)

    await user.hover(screen.getByRole("button", { name: "Undo" }))

    expect(await screen.findByText("Undo")).toBeInTheDocument()
  })

  it("explains the disabled state in the undo tooltip", async () => {
    const user = userEvent.setup()
    renderPage()

    await user.hover(screen.getByRole("button", { name: "Undo" }))

    expect(await screen.findByText("Nothing to undo")).toBeInTheDocument()
  })

  it("does not record an entry for a plain text edit", async () => {
    const user = userEvent.setup()
    renderPage()

    // addParagraphWithMenu adds the section, then the text is typed into it.
    await addParagraphWithText(user, "Some typing")

    // One add, one undo — typing must not add entries of its own, so nothing
    // is left to undo (redo of the add is still available).
    await user.click(screen.getByRole("button", { name: "Undo" }))

    expect(screen.getByText(/No sections yet/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Undo" })).toBeDisabled()
  })

  it("undoes with the keyboard shortcut", async () => {
    const user = userEvent.setup()
    renderPage()

    await addParagraphWithText(user, "Keyboard undo")
    await deleteOnlySection(user)
    expect(screen.getByText(/No sections yet/i)).toBeInTheDocument()

    await user.keyboard("{Control>}z{/Control}")

    expect(screen.getByLabelText(/^Paragraph/)).toHaveValue("Keyboard undo")
  })

  it("leaves the keyboard shortcut alone while a text field is focused", async () => {
    const user = userEvent.setup()
    renderPage()

    await addParagraphWithText(user, "Keep me")
    await addSectionViaMenu(user, "Experience")
    await user.click(screen.getByRole("button", { name: /^Remove .*Experience.* section$/i }))

    expect(screen.getAllByLabelText(/^Section title/)).toHaveLength(1)

    // Focus a text field, then press the shortcut. Native text undo owns this
    // keystroke, so the deleted section must not come back.
    await user.click(screen.getByLabelText(/^Section title/))
    await user.keyboard("{Control>}z{/Control}")

    expect(screen.getAllByLabelText(/^Section title/)).toHaveLength(1)
  })

  it("keeps edits made to another section after undoing a delete", async () => {
    const user = userEvent.setup()
    renderPage()

    await addSectionViaMenu(user, "Paragraph")
    const paragraphs = () => screen.getAllByLabelText(/^Paragraph/)
    await user.type(paragraphs()[0], "First body")

    await addSectionViaMenu(user, "Paragraph")
    await user.type(paragraphs()[1], "Second body")

    // Remove the second section, then edit the first one further.
    await user.click(screen.getAllByRole("button", { name: /^Remove .* section$/i })[1])
    expect(paragraphs()).toHaveLength(1)

    await user.type(paragraphs()[0], " and more")

    await user.click(screen.getByRole("button", { name: "Undo" }))

    // The section comes back, and the later edit to its sibling survives.
    expect(paragraphs()).toHaveLength(2)
    expect(paragraphs()[0]).toHaveValue("First body and more")
    expect(paragraphs()[1]).toHaveValue("Second body")
  })

  it("keeps edits made to another bullet after undoing a bullet delete", async () => {
    const user = userEvent.setup()
    renderPage()

    await addSectionViaMenu(user, "Experience")
    await user.click(screen.getByRole("button", { name: "Add role" }))
    await user.click(screen.getByRole("button", { name: "Add bullet" }))
    await user.click(await screen.findByRole("menuitem", { name: /Simple bullet/ }))
    await user.click(screen.getByRole("button", { name: "Add bullet" }))
    await user.click(await screen.findByRole("menuitem", { name: /Simple bullet/ }))

    const bullets = () => screen.getAllByRole("textbox", { name: /bullet \d+$/ })
    await user.type(bullets()[0], "alpha")
    await user.type(bullets()[1], "beta")

    await user.click(screen.getAllByRole("button", { name: /^Remove .* bullet$/i })[0])
    expect(bullets()).toHaveLength(1)

    await user.type(bullets()[0], " edited")

    await user.click(screen.getByRole("button", { name: "Undo" }))

    expect(bullets()).toHaveLength(2)
    expect(bullets()[0]).toHaveValue("alpha")
    expect(bullets()[1]).toHaveValue("beta edited")
  })

  it("undoes an added skill", async () => {
    const user = userEvent.setup()
    renderPage()

    await addSectionViaMenu(user, "Skills")

    const skillBox = screen.getByPlaceholderText("Type a skill and press Enter")
    await user.type(skillBox, "React{Enter}")

    expect(screen.getByText("React")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Undo" }))

    // The skill is gone, but the group it belonged to is untouched. Without an
    // entry for the skill this undo would remove the whole section instead.
    expect(screen.queryByText("React")).not.toBeInTheDocument()
    expect(screen.getByLabelText(/^Group title/)).toBeInTheDocument()
  })
})
