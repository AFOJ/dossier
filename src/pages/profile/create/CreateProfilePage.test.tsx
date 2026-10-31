import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, afterEach, expect, it, vi } from "vitest"
import CreateProfilePage from "./CreateProfilePage"
import { importProfile, upsertProfile } from "@/db/profile"

vi.mock("@/db/profile", () => ({ importProfile: vi.fn(), upsertProfile: vi.fn() }))
const navigate = vi.fn()
vi.mock("react-router-dom", () => ({ useNavigate: () => navigate }))
beforeEach(() => {
  vi.resetAllMocks()
})
afterEach(() => {
  vi.restoreAllMocks()
})

async function startSetup() {
  const user = userEvent.setup()
  render(<CreateProfilePage />)
  await user.click(screen.getByRole("button", { name: "Create my profile" }))
  return user
}

it("offers setup and import, with manually selected feature slides", async () => {
  const user = userEvent.setup()
  render(<CreateProfilePage />)
  expect(screen.getByRole("heading", { name: "Set up your Dossier profile" })).toBeInTheDocument()
  expect(screen.queryByLabelText(/Full name/)).not.toBeInTheDocument()
  expect(screen.getByRole("button", { name: "Import an existing profile" })).toBeInTheDocument()
  const privacyButton = screen.getByRole("button", { name: /Show feature 3/ })
  privacyButton.focus()
  await user.keyboard("{Enter}")
  expect(screen.getByRole("heading", { name: "Your career. Your data." })).toBeInTheDocument()
  expect(privacyButton).toHaveAttribute("aria-current", "true")
  await user.click(screen.getByRole("button", { name: "Create my profile" }))
  expect(screen.queryByRole("region", { name: "Dossier features" })).not.toBeInTheDocument()
  expect(screen.getByLabelText(/Full name/)).toHaveFocus()
})

it("validates each step and keeps entries through back navigation", async () => {
  const user = await startSetup()
  await user.click(screen.getByRole("button", { name: "Continue" }))
  expect(await screen.findByText("Full name is required")).toBeInTheDocument()
  expect(screen.getByLabelText(/Full name/)).toHaveFocus()
  expect(screen.getByLabelText(/Full name/)).toHaveAccessibleDescription("Full name is required")
  await user.type(screen.getByLabelText(/Full name/), "A")
  await user.click(screen.getByRole("button", { name: "Continue" }))
  expect(await screen.findByText("Full name must be at least 2 characters")).toBeInTheDocument()
  await user.type(screen.getByLabelText(/Full name/), "lex Morgan")
  expect(screen.queryByRole("group", { name: "Job title suggestions" })).not.toBeInTheDocument()
  expect(screen.getByRole("textbox", { name: /Job title/ })).toHaveAccessibleDescription(
    "You can change your job title at any time.",
  )
  await user.type(screen.getByRole("textbox", { name: /Job title/ }), "Architect")
  await user.click(screen.getByRole("button", { name: "Continue" }))
  expect(screen.getByLabelText("Location")).toHaveFocus()
  expect(screen.getByRole("heading", { name: "Contact details" })).toHaveAccessibleDescription(
    "Step 2 of 3 Optional. You can add these later.",
  )
  expect(document.title).toContain("Step 2 of 3: Contact details")
  expect(screen.getByRole("status")).toHaveTextContent("Step 2 of 3: Contact details. Optional.")
  await user.tab()
  expect(screen.getByLabelText("Email")).toHaveFocus()
  await user.type(screen.getByLabelText("Email"), "invalid")
  await user.click(screen.getByRole("button", { name: "Continue" }))
  expect(await screen.findByText("Invalid email address")).toBeInTheDocument()
  expect(screen.getByLabelText("Email")).toHaveFocus()
  await user.clear(screen.getByLabelText("Email"))
  await user.type(screen.getByLabelText("Email"), "alex@example.com")
  await user.click(screen.getByRole("button", { name: "Back" }))
  expect(screen.getByLabelText(/Full name/)).toHaveFocus()
  expect(screen.getByLabelText(/Full name/)).toHaveValue("Alex Morgan")
  expect(screen.getByRole("textbox", { name: /Job title/ })).toHaveValue("Architect")
  await user.click(screen.getByRole("button", { name: "Continue" }))
  expect(screen.getByLabelText("Email")).toHaveValue("alex@example.com")
  expect(upsertProfile).not.toHaveBeenCalled()
})

it("validates links, preserves them between steps, and saves the full profile", async () => {
  vi.mocked(upsertProfile).mockResolvedValue(1)
  const user = await startSetup()
  await user.type(screen.getByLabelText(/Full name/), "Alex Morgan")
  await user.click(screen.getByRole("button", { name: "Continue" }))
  await user.type(screen.getByLabelText("Location"), "London")
  await user.click(screen.getByRole("button", { name: "Continue" }))
  expect(screen.getByRole("button", { name: "Add social link" })).toHaveFocus()
  await user.keyboard("{Enter}")
  expect(screen.getByLabelText("Label")).toHaveFocus()
  await user.click(screen.getByRole("button", { name: "Create my profile" }))
  expect(await screen.findByText("Label is required")).toBeInTheDocument()
  expect(screen.getByText("Must be a valid URL")).toBeInTheDocument()
  await user.type(screen.getByLabelText("Label"), "Portfolio")
  expect(screen.getByRole("group", { name: "Portfolio" })).toBeInTheDocument()
  expect(screen.getByRole("button", { name: "Remove Portfolio" })).toBeInTheDocument()
  await user.hover(screen.getByRole("button", { name: "Reorder Portfolio" }))
  expect(await screen.findByText("Reorder Portfolio")).toBeInTheDocument()
  await user.unhover(screen.getByRole("button", { name: "Reorder Portfolio" }))
  await user.hover(screen.getByRole("button", { name: "Remove Portfolio" }))
  expect(await screen.findByText("Remove Portfolio")).toBeInTheDocument()
  await user.unhover(screen.getByRole("button", { name: "Remove Portfolio" }))
  await user.type(screen.getByLabelText("URL"), "https://example.com")
  await user.click(screen.getByRole("button", { name: "Add social link" }))
  const emptyRow = screen.getByRole("group", { name: "link 2" })
  expect(within(emptyRow).getByLabelText("Label")).toHaveFocus()
  await user.click(screen.getByRole("button", { name: "Remove link 2" }))
  expect(screen.getByLabelText("Label")).toHaveFocus()
  await user.click(screen.getByRole("button", { name: "Add social link" }))
  await user.click(screen.getByRole("button", { name: "Remove Portfolio" }))
  expect(screen.getByLabelText("Label")).toHaveFocus()
  await user.click(screen.getByRole("button", { name: "Remove link 1" }))
  expect(screen.getByRole("button", { name: "Add social link" })).toHaveFocus()
  await user.keyboard("{Enter}")
  await user.type(screen.getByLabelText("Label"), "Portfolio")
  await user.type(screen.getByLabelText("URL"), "https://example.com")
  await user.click(screen.getByRole("button", { name: "Back" }))
  await user.click(screen.getByRole("button", { name: "Continue" }))
  expect(screen.getByLabelText("Label")).toHaveValue("Portfolio")
  await user.click(screen.getByRole("button", { name: "Create my profile" }))
  await waitFor(() =>
    expect(upsertProfile).toHaveBeenCalledWith({
      full_name: "Alex Morgan",
      role: null,
      location: "London",
      phone: null,
      email: null,
      links: [{ label: "Portfolio", url: "https://example.com" }],
    }),
  )
  expect(navigate).toHaveBeenCalledWith("/resumes")
})

it("allows blank optional steps, retains entries and keeps focus for a failed-save retry", async () => {
  vi.spyOn(console, "error").mockImplementation(() => {})
  vi.mocked(upsertProfile).mockRejectedValueOnce(new Error("Save failed")).mockResolvedValue(1)
  const user = await startSetup()
  await user.type(screen.getByLabelText(/Full name/), "Alex Morgan")
  await user.click(screen.getByRole("button", { name: "Back" }))
  expect(screen.getByRole("button", { name: "Create my profile" })).toHaveFocus()
  await user.click(screen.getByRole("button", { name: "Create my profile" }))
  expect(screen.getByLabelText(/Full name/)).toHaveValue("Alex Morgan")
  await user.click(screen.getByRole("button", { name: "Continue" }))
  await user.click(screen.getByRole("button", { name: "Continue" }))
  await user.click(screen.getByRole("button", { name: "Create my profile" }))
  expect(await screen.findByRole("alert")).toHaveTextContent("Failed to save profile")
  expect(screen.getByRole("button", { name: "Create my profile" })).toHaveFocus()
  await user.click(screen.getByRole("button", { name: "Back" }))
  expect(screen.queryByRole("alert")).not.toBeInTheDocument()
  expect(screen.getByLabelText("Location")).toHaveFocus()
  await user.click(screen.getByRole("button", { name: "Continue" }))
  expect(screen.queryByRole("alert")).not.toBeInTheDocument()
  await user.tab()
  await user.tab()
  expect(screen.getByRole("button", { name: "Create my profile" })).toHaveFocus()
  await user.keyboard("{Enter}")
  await waitFor(() => expect(navigate).toHaveBeenCalledWith("/resumes"))
  await waitFor(() =>
    expect(upsertProfile).toHaveBeenCalledWith({
      full_name: "Alex Morgan",
      role: null,
      location: null,
      email: null,
      phone: null,
      links: [],
    }),
  )
})

it.each([true, false])(
  "imports from the welcome screen and handles success: %s",
  async (success) => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    if (success) vi.mocked(importProfile).mockResolvedValue(undefined)
    else vi.mocked(importProfile).mockRejectedValue(new Error("Invalid backup"))
    const user = userEvent.setup()
    const { container } = render(<CreateProfilePage />)
    const input = container.querySelector<HTMLInputElement>('input[type="file"]')!
    const openPicker = vi.spyOn(input, "click")
    await user.click(screen.getByRole("button", { name: "Import an existing profile" }))
    expect(openPicker).toHaveBeenCalledTimes(1)
    await user.upload(
      input,
      new File(['{"profile":{}}'], "backup.json", { type: "application/json" }),
    )
    expect(importProfile).toHaveBeenCalledWith('{"profile":{}}')
    if (success) await waitFor(() => expect(navigate).toHaveBeenCalledWith("/profile"))
    else {
      expect(await screen.findByRole("alert")).toHaveTextContent("not a valid Dossier export")
      expect(navigate).not.toHaveBeenCalled()
    }
  },
)

function deferred<Value>() {
  let resolve!: (value: Value) => void
  const promise = new Promise<Value>((complete) => {
    resolve = complete
  })
  return { promise, resolve }
}

async function goToLinks() {
  const user = await startSetup()
  await user.type(screen.getByLabelText(/Full name/), "Alex Morgan")
  await user.click(screen.getByRole("button", { name: "Continue" }))
  await user.click(screen.getByRole("button", { name: "Continue" }))
  return user
}

it("locks submissions before validation and holds the lock until saving finishes", async () => {
  const save = deferred<number>()
  vi.mocked(upsertProfile).mockReturnValue(save.promise)
  await goToLinks()
  const form = screen.getByRole("button", { name: "Create my profile" }).closest("form")!
  act(() => {
    fireEvent.submit(form)
    fireEvent.submit(form)
  })
  await waitFor(() => expect(upsertProfile).toHaveBeenCalledTimes(1))
  fireEvent.submit(form)
  expect(upsertProfile).toHaveBeenCalledTimes(1)
  await act(async () => {
    save.resolve(1)
  })
  expect(navigate).toHaveBeenCalledTimes(1)
})

it.each([0, 2])("discards pending validation after Back from step %s", async (step) => {
  if (step === 0) {
    const user = await startSetup()
    await user.type(screen.getByLabelText(/Full name/), "Alex Morgan")
  } else await goToLinks()
  const backButton = screen.getByRole("button", { name: "Back" })
  const form = backButton.closest("form")!
  await act(async () => {
    fireEvent.submit(form)
    fireEvent.click(backButton)
  })
  if (step === 0) {
    expect(screen.getByRole("heading", { name: "Set up your Dossier profile" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Create my profile" })).toHaveFocus()
  } else {
    expect(screen.getByRole("heading", { name: "Contact details" })).toBeInTheDocument()
    expect(screen.getByLabelText("Location")).toHaveFocus()
  }
  expect(upsertProfile).not.toHaveBeenCalled()
  expect(navigate).not.toHaveBeenCalled()
})

it("keeps setup blocked while a backup is read and restored", async () => {
  const read = deferred<string>()
  const restore = deferred<void>()
  vi.mocked(importProfile).mockReturnValue(restore.promise)
  const user = userEvent.setup()
  const { container } = render(<CreateProfilePage />)
  const file = new File(["{}"], "backup.json", { type: "application/json" })
  Object.defineProperty(file, "text", { value: () => read.promise })
  await user.upload(container.querySelector<HTMLInputElement>('input[type="file"]')!, file)
  const setupButton = screen.getByRole("button", { name: "Create my profile" })
  expect(setupButton).toHaveAttribute("aria-disabled", "true")
  await user.click(setupButton)
  expect(screen.queryByLabelText(/Full name/)).not.toBeInTheDocument()
  expect(importProfile).not.toHaveBeenCalled()
  await act(async () => {
    read.resolve('{"profile":{}}')
  })
  expect(importProfile).toHaveBeenCalledTimes(1)
  await user.click(setupButton)
  expect(screen.queryByLabelText(/Full name/)).not.toBeInTheDocument()
  expect(upsertProfile).not.toHaveBeenCalled()
  await act(async () => {
    restore.resolve()
  })
  expect(navigate).toHaveBeenCalledWith("/profile")
})
