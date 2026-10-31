import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { createMemoryRouter, RouterProvider } from "react-router-dom"
import SettingsPage from "@/pages/settings/SettingsPage"
import type { Profile } from "@/db/db"
import { db } from "@/db/db"
import { DEFAULT_SETTINGS, getSettings, upsertSettings } from "@/db/settings"
import { ModalProvider } from "@/components/modal"

// Settings arrive asynchronously, so the loading state is only reachable by
// controlling the hook that resolves them. `real` keeps the genuine hook as the
// default so every other test exercises the real read path.
const settingsMock = vi.hoisted(() => ({
  useSettings: vi.fn(),
  real: null as unknown as typeof import("@/hooks/useSettings").useSettings,
}))

vi.mock("@/hooks/useSettings", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/hooks/useSettings")>()
  settingsMock.real = actual.useSettings
  settingsMock.useSettings.mockImplementation(actual.useSettings)
  return { useSettings: settingsMock.useSettings }
})

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
  beforeEach(async () => {
    vi.clearAllMocks()
    await db.settings.clear()
    settingsMock.useSettings.mockImplementation(settingsMock.real)
  })
  afterEach(async () => {
    await db.settings.clear()
  })

  it("waits for stored settings before mounting the form", async () => {
    settingsMock.useSettings.mockReturnValue({ settings: DEFAULT_SETTINGS, isLoaded: false })
    const { container, unmount } = renderPage()
    expect(await screen.findByRole("status")).toHaveTextContent("Loading settings")
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull()
    expect(screen.queryByRole("switch")).not.toBeInTheDocument()
    unmount()
    settingsMock.useSettings.mockReturnValue({ settings: DEFAULT_SETTINGS, isLoaded: true })
    renderPage()
    expect(await screen.findByRole("status")).toHaveTextContent("Settings loaded")
    expect(
      screen.getByRole("switch", { name: "Sync new documents to my profile" }),
    ).toBeInTheDocument()
  })

  it("loads saved groups and keeps one save action across tabs", async () => {
    await upsertSettings({
      documents: { defaultSyncProfile: false },
      exports: { defaultResumePdfFilenameFormat: "{title}-cv.pdf" },
    })
    const user = userEvent.setup()
    renderPage()
    expect(await screen.findByRole("switch")).not.toBeChecked()
    expect(screen.getByRole("tab", { name: "Documents" })).toHaveAttribute("aria-selected", "true")
    await user.click(screen.getByRole("tab", { name: "Exports" }))
    expect(screen.getByLabelText("Resume PDF filename")).toHaveValue("{title}-cv.pdf")
    expect(screen.getByRole("button", { name: "Save changes" })).toBeDisabled()
    await user.click(screen.getByRole("tab", { name: "Data" }))
    expect(screen.getByText("Export your data")).toBeVisible()
    expect(screen.getByText("Danger zone")).toBeVisible()
    expect(screen.getAllByRole("button", { name: "Save changes" })).toHaveLength(1)
  })

  it("retains edits across tabs, saves grouped values and reverts to the saved state", async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(await screen.findByRole("switch"))
    fireEvent.change(screen.getByLabelText("New resume title"), {
      target: { value: "{profile.name} CV" },
    })
    expect(screen.getByText(/Currently produces:/)).toHaveTextContent("John Doe CV")
    await user.click(screen.getByRole("tab", { name: "Exports" }))
    fireEvent.change(screen.getByLabelText("Resume PDF filename"), {
      target: { value: "{title}-custom" },
    })
    expect(screen.getByText("Example: my-document-custom.pdf")).toBeInTheDocument()
    await user.click(screen.getByRole("tab", { name: "Data" }))
    await user.click(screen.getByRole("button", { name: "Save changes" }))
    await waitFor(() => expect(screen.getByRole("button", { name: "Save changes" })).toBeDisabled())
    expect((await getSettings()).documents.defaultSyncProfile).toBe(false)
    expect((await getSettings()).exports.defaultResumePdfFilenameFormat).toBe("{title}-custom")
    await user.click(screen.getByRole("tab", { name: "Documents" }))
    expect(screen.getByLabelText("New resume title")).toHaveValue("{profile.name} CV")
    await user.click(screen.getByRole("switch"))
    await user.click(screen.getByRole("button", { name: "Revert" }))
    expect(screen.getByRole("switch")).not.toBeChecked()
    expect(screen.getByRole("button", { name: "Save changes" })).toBeDisabled()
  })

  it("switches PDF patterns without losing the inactive formats", async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(await screen.findByRole("tab", { name: "Exports" }))
    fireEvent.change(screen.getByLabelText("Resume PDF filename"), {
      target: { value: "{title}-cv" },
    })
    await user.click(screen.getByRole("radio", { name: "Shared format" }))
    expect(screen.getByLabelText("PDF filename")).toHaveValue("{title}-{kind}.pdf")
    expect(screen.queryByLabelText("Resume PDF filename")).not.toBeInTheDocument()
    await user.click(screen.getByRole("radio", { name: "Separate formats" }))
    expect(screen.getByLabelText("Resume PDF filename")).toHaveValue("{title}-cv")
    await user.clear(screen.getByLabelText("Resume PDF filename"))
    await user.click(screen.getByRole("radio", { name: "Shared format" }))
    await user.click(screen.getByRole("button", { name: "Save changes" }))
    await waitFor(() => expect(screen.getByLabelText("Resume PDF filename")).toHaveFocus())
    expect(screen.getByRole("radio", { name: "Separate formats" })).toBeChecked()
  })

  it("reveals and focuses invalid settings when saved from another tab", async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByRole("switch")
    await user.clear(screen.getByLabelText("New resume title"))
    await user.click(screen.getByRole("tab", { name: "Data" }))
    await user.click(screen.getByRole("button", { name: "Save changes" }))
    await waitFor(() => expect(screen.getByLabelText("New resume title")).toHaveFocus())
    expect(screen.getByRole("tab", { name: "Documents" })).toHaveAttribute("aria-selected", "true")
    expect(screen.getByLabelText("New resume title")).toHaveAccessibleDescription(
      expect.stringContaining("Enter a title format."),
    )
    expect((await getSettings()).documents).toEqual(DEFAULT_SETTINGS.documents)
  })

  it("saves only edited fields and adopts changes saved by another tab", async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByRole("switch")
    fireEvent.change(screen.getByLabelText("New resume title"), { target: { value: "My CV" } })
    // Simulate another tab saving a field in the same group and a different group.
    await act(async () => {
      await upsertSettings({
        documents: { defaultSyncProfile: false },
        exports: { pdfFilenamePattern: "shared" },
      })
    })
    await user.click(screen.getByRole("button", { name: "Save changes" }))
    await waitFor(() => expect(screen.getByRole("button", { name: "Save changes" })).toBeDisabled())
    expect((await getSettings()).documents).toEqual({
      defaultSyncProfile: false,
      defaultResumeTitleFormat: "My CV",
    })
    expect((await getSettings()).exports.pdfFilenamePattern).toBe("shared")
    expect(screen.getByRole("switch")).not.toBeChecked()
    await user.click(screen.getByRole("tab", { name: "Exports" }))
    expect(screen.getByRole("radio", { name: "Shared format" })).toBeChecked()
  })

  it("supports keyboard tab navigation", async () => {
    const user = userEvent.setup()
    renderPage()
    const documentsTab = await screen.findByRole("tab", { name: "Documents" })
    documentsTab.focus()
    await user.keyboard("{ArrowRight}")
    expect(screen.getByRole("tab", { name: "Exports" })).toHaveFocus()
    expect(screen.getByRole("tab", { name: "Exports" })).toHaveAttribute("aria-selected", "true")
    await user.keyboard("{End}")
    expect(screen.getByRole("tab", { name: "Data" })).toHaveFocus()
    expect(screen.getByRole("tabpanel", { name: "Data" })).toBeVisible()
  })
})
