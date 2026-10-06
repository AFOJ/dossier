import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { createMemoryRouter, RouterProvider } from "react-router-dom"
import SettingsPage from "@/pages/settings/SettingsPage"
import type { Profile } from "@/db/db"
import { ModalProvider } from "@/components/modal"

vi.mock("@/db/profile", () => ({
  updateProfile: vi.fn(),
}))

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
  role: "Engineer",
  email: "john@doe.com",
  phone: null,
  location: null,
  links: [],
}

function renderPage() {
  const router = createMemoryRouter(
    [
      {
        id: "protected",
        path: "/",
        loader: () => ({ profile }),
        children: [
          {
            id: "settings",
            path: "/settings",
            element: (
              <ModalProvider>
                <SettingsPage />
              </ModalProvider>
            ),
          },
        ],
      },
      { path: "/resumes", element: <div>Resumes list</div> },
    ],
    { initialEntries: ["/settings"] },
  )

  return render(<RouterProvider router={router} />)
}

describe("SettingsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders the sections", async () => {
    renderPage()

    expect(await screen.findByText("Settings")).toBeInTheDocument()
    expect(screen.getByText("Documents")).toBeInTheDocument()
    expect(screen.getByText("Data")).toBeInTheDocument()
    expect(screen.getByText("Backup")).toBeInTheDocument()
    expect(screen.getByText("Danger zone")).toBeInTheDocument()
  })

  it("toggles the sync profile setting", async () => {
    const user = userEvent.setup()
    renderPage()

    const syncSwitch = await screen.findByRole("switch", {
      name: "Sync new documents to my profile",
    })
    expect(syncSwitch).toBeChecked()

    await user.click(syncSwitch)
    expect(syncSwitch).not.toBeChecked()
  })

  it("updates the title format and shows a live preview", async () => {
    const user = userEvent.setup()
    renderPage()

    await screen.findByText("New resume title")
    const input = screen.getByLabelText("New resume title")
    expect(input).toHaveValue("{profile.role} Resume")

    await user.clear(input)
    // Use fireEvent to set value with braces, avoiding userEvent keyboard parsing
    fireEvent.change(input, { target: { value: "{profile.name} CV {year}" } })

    const preview = screen.getByText(/Currently produces:/)
    expect(preview).toHaveTextContent("John Doe CV 2026")
  })

  it("saves the settings on submit", async () => {
    const user = userEvent.setup()
    renderPage()

    // Toggle sync off to make the form dirty
    const syncSwitch = await screen.findByRole("switch", {
      name: "Sync new documents to my profile",
    })
    await user.click(syncSwitch)

    await user.click(screen.getByRole("button", { name: "Save changes" }))

    // Wait for the save to complete and the button to become disabled
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Save changes" })).toBeDisabled()
    })
  })
})
