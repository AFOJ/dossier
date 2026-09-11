import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { ModalProvider } from "@/components/modal"
import UploadResumePage from "@/pages/resumes/upload/UploadResumePage"
import { getResume, createResume, updateResume } from "@/db/resume"
import type { Resume } from "@/db/db"

vi.mock("@/db/resume", () => ({
  getResume: vi.fn(),
  createResume: vi.fn(),
  updateResume: vi.fn(),
}))

const mockGetResume = vi.mocked(getResume)
const mockCreateResume = vi.mocked(createResume)
const mockUpdateResume = vi.mocked(updateResume)

function makeResumeJson(overrides: Record<string, unknown> = {}): string {
  return JSON.stringify({
    id: crypto.randomUUID(),
    title: "Untitled",
    sections: [],
    ...overrides,
  })
}

function makeFile(name: string, contents: string, type = "application/json"): File {
  return new File([contents], name, { type })
}

function renderPage() {
  render(
    <ModalProvider>
      <MemoryRouter initialEntries={["/resumes/upload"]}>
        <Routes>
          <Route path="/resumes/upload" element={<UploadResumePage />} />
          <Route path="/resumes" element={<div>Resumes page</div>} />
        </Routes>
      </MemoryRouter>
    </ModalProvider>,
  )
}

function fileInput(): HTMLInputElement {
  const input = document.querySelector('input[type="file"]')
  if (!(input instanceof HTMLInputElement)) {
    throw new Error("File input not found")
  }
  return input
}

async function stageFiles(files: File[]) {
  const user = userEvent.setup()
  await user.upload(fileInput(), files)
  for (const staged of files) {
    await screen.findByText(staged.name)
  }
}

describe("UploadResumePage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetResume.mockResolvedValue(undefined)
  })

  it("imports fresh resumes without conflicts", async () => {
    const user = userEvent.setup()
    renderPage()
    await stageFiles([
      makeFile(
        "a.json",
        makeResumeJson({ id: "11111111-1111-4111-8111-111111111111", title: "Resume A" }),
      ),
      makeFile(
        "b.json",
        makeResumeJson({ id: "22222222-2222-4222-8222-222222222222", title: "Resume B" }),
      ),
    ])

    await user.click(await screen.findByRole("button", { name: "Import 2 resumes" }))

    await waitFor(() => {
      expect(mockCreateResume).toHaveBeenCalledTimes(2)
    })
    expect(mockCreateResume).toHaveBeenCalledWith(
      "Resume A",
      [],
      expect.objectContaining({ id: "11111111-1111-4111-8111-111111111111" }),
    )
    expect(await screen.findByText("Resumes page")).toBeInTheDocument()
  })

  it("marks invalid files and only imports the valid ones", async () => {
    const user = userEvent.setup()
    renderPage()
    await stageFiles([
      makeFile(
        "good.json",
        makeResumeJson({ id: "33333333-3333-4333-8333-333333333333", title: "Good Resume" }),
      ),
      makeFile("broken.json", "{not json"),
    ])

    expect(await screen.findByText("File is not valid JSON.")).toBeInTheDocument()
    expect(screen.getByText(/1 of 2 valid/)).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Import 1 resume" }))

    await waitFor(() => {
      expect(mockCreateResume).toHaveBeenCalledTimes(1)
    })
    expect(mockCreateResume).toHaveBeenCalledWith(
      "Good Resume",
      [],
      expect.objectContaining({ id: "33333333-3333-4333-8333-333333333333" }),
    )
  })

  it("opens the single conflict dialog for one duplicate", async () => {
    const user = userEvent.setup()
    const existing = {
      id: "44444444-4444-4444-8444-444444444444",
      title: "Existing Resume",
      sections: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      syncProfile: true,
      contact: null,
    } as Resume
    mockGetResume.mockResolvedValue(existing)
    renderPage()
    await stageFiles([
      makeFile(
        "dup.json",
        makeResumeJson({ id: "44444444-4444-4444-8444-444444444444", title: "Incoming" }),
      ),
    ])

    await user.click(await screen.findByRole("button", { name: "Import 1 resume" }))

    expect(await screen.findByRole("dialog")).toHaveTextContent("Resume already exists")
    expect(mockCreateResume).not.toHaveBeenCalled()

    await user.click(screen.getByRole("button", { name: "Overwrite" }))

    await waitFor(() => {
      expect(mockUpdateResume).toHaveBeenCalledWith(
        "44444444-4444-4444-8444-444444444444",
        expect.objectContaining({ title: "Incoming" }),
      )
    })
    expect(await screen.findByText("Resumes page")).toBeInTheDocument()
  })

  it("opens the bulk conflict dialog for multiple duplicates and applies decisions", async () => {
    const user = userEvent.setup()
    mockGetResume.mockImplementation(async (id: string) => {
      return {
        id,
        title: `Existing ${id}`,
        sections: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        syncProfile: true,
        contact: null,
      } as Resume
    })
    renderPage()
    await stageFiles([
      makeFile(
        "one.json",
        makeResumeJson({ id: "55555555-5555-4555-8555-555555555555", title: "One" }),
      ),
      makeFile(
        "two.json",
        makeResumeJson({ id: "66666666-6666-4656-8666-666666666666", title: "Two" }),
      ),
    ])

    await user.click(await screen.findByRole("button", { name: "Import 2 resumes" }))

    expect(await screen.findByText("Resolve conflicts (1 of 2)")).toBeInTheDocument()
    expect(mockCreateResume).not.toHaveBeenCalled()

    await user.click(screen.getByRole("button", { name: "Keep all existing" }))
    await user.click(screen.getByRole("button", { name: "Import (2/2)" }))

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    })
    expect(mockCreateResume).not.toHaveBeenCalled()
    expect(mockUpdateResume).not.toHaveBeenCalled()
  })
})
