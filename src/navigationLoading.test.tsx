import { useLayoutEffect } from "react"
import { act, render, screen, waitFor } from "@testing-library/react"
import { createMemoryRouter, RouterProvider } from "react-router-dom"
import { afterEach, beforeEach, expect, it, vi } from "vitest"
import { createAppRoutes } from "@/routeConfig"
import { db } from "@/db/db"
import * as settingsStore from "@/db/settings"
import { useSettings } from "@/hooks/useSettings"
import { useResumeTable } from "@/hooks/useResumeTable"
import { useCoverLetterTable } from "@/hooks/useCoverLetterTable"
import { useTagsTable } from "@/hooks/useTagsTable"

const commits = vi.hoisted(() => [] as { page: string; loaded: boolean; items?: string[] }[])

function useRecordCommit(page: string, loaded: boolean, items?: string[]) {
  useLayoutEffect(() => {
    commits.push({ page, loaded, items })
  })
}

function SettingsProbe({ page }: Readonly<{ page: string }>) {
  const { settings, isLoaded } = useSettings()
  useRecordCommit(page, isLoaded)
  return (
    <>
      <h1>{page}</h1>
      <p>{settings.documents.defaultResumeTitleFormat}</p>
    </>
  )
}
function ResumesProbe() {
  const table = useResumeTable()
  const { settings, isLoaded } = useSettings()
  useRecordCommit(
    "Resumes page",
    !table.isLoading && table.totalDbCount !== undefined && isLoaded,
    table.pageItems.map((item) => item.title),
  )
  return (
    <>
      <h1>Resumes page</h1>
      <p>{settings.documents.defaultResumeTitleFormat}</p>
      <ul>
        {table.pageItems.map((item) => (
          <li key={item.id}>{item.title}</li>
        ))}
      </ul>
    </>
  )
}
function CoverLettersProbe() {
  const table = useCoverLetterTable()
  useRecordCommit("Letters page", !table.isLoading && table.totalDbCount !== undefined)
  return <h1>Letters page</h1>
}
function TagsProbe() {
  const table = useTagsTable()
  useRecordCommit("Tags page", !table.isLoading && table.totalDbCount !== undefined)
  return <h1>Tags page</h1>
}

// Keep production routing and data hooks; record the first DOM commit so a
// one-frame placeholder cannot pass just because the final screen looks right.
vi.mock("@/pages/profile/view", () => ({ default: () => <h1>Profile page</h1> }))
vi.mock("@/pages/resumes/list", () => ({ default: ResumesProbe }))
vi.mock("@/pages/cover-letters/list", () => ({ default: CoverLettersProbe }))
vi.mock("@/pages/tags", () => ({ default: TagsProbe }))
vi.mock("@/pages/settings", () => ({ default: () => <SettingsProbe page="Settings page" /> }))
vi.mock("@/pages/resumes/create", () => ({ default: () => <SettingsProbe page="Create resume" /> }))
vi.mock("@/pages/cover-letters/create", () => ({
  default: () => <SettingsProbe page="Create letter" />,
}))

beforeEach(async () => {
  commits.length = 0
  await Promise.all([
    db.profiles.clear(),
    db.resumes.clear(),
    db.coverLetters.clear(),
    db.tags.clear(),
    db.settings.clear(),
  ])
  await db.profiles.add({
    full_name: "Navigation Test",
    role: null,
    email: null,
    phone: null,
    location: null,
    links: [],
  })
  await settingsStore.upsertSettings({ documents: { defaultResumeTitleFormat: "Saved title" } })
  const now = new Date()
  await db.resumes.bulkPut(
    Array.from({ length: 5 }, (_, index) => ({
      id: `resume-${index}`,
      title: index === 4 ? "Other" : `Engineer ${index + 1}`,
      sections: [],
      tagIds: [],
      createdAt: now,
      updatedAt: now,
    })),
  )
  await db.coverLetters.put({
    id: "letter-1",
    title: "Engineer letter",
    body: "Hello",
    tagIds: [],
    createdAt: now,
    updatedAt: now,
  })
})
afterEach(() => {
  vi.restoreAllMocks()
})

async function startAtProfile() {
  const router = createMemoryRouter(createAppRoutes(), { initialEntries: ["/profile"] })
  render(<RouterProvider router={router} />)
  await screen.findByRole("heading", { name: "Profile page" })
  return router
}

it("keeps the current page until each destination has data, then commits without placeholders", async () => {
  const router = await startAtProfile()
  const storedSettings = await settingsStore.getSettings()
  const destinations = [
    ["/resumes?query=Engineer&page=2&perPage=2", "Resumes page"],
    ["/cover-letters?query=Engineer", "Letters page"],
    ["/tags", "Tags page"],
    ["/settings", "Settings page"],
    ["/resumes/create", "Create resume"],
    ["/cover-letters/create", "Create letter"],
  ]
  for (const [path, page] of destinations) {
    let finishRead!: (value: settingsStore.Settings) => void
    const pending = new Promise<settingsStore.Settings>((resolve) => {
      finishRead = resolve
    })
    const read = vi.spyOn(settingsStore, "getSettings").mockImplementationOnce(() => pending)
    act(() => {
      void router.navigate(path)
    })
    await waitFor(() => expect(read).toHaveBeenCalled())
    expect(screen.getByRole("heading", { name: "Profile page" })).toBeInTheDocument()
    expect(screen.queryByRole("heading", { name: page })).not.toBeInTheDocument()
    expect(screen.getByRole("main")).toHaveAttribute("aria-busy", "true")
    await act(async () => {
      finishRead(storedSettings)
    })
    await screen.findByRole("heading", { name: page })
    const pageCommits = commits.filter((commit) => commit.page === page)
    expect(pageCommits.length, path).toBeGreaterThan(0)
    expect(
      pageCommits.every((commit) => commit.loaded),
      path,
    ).toBe(true)
    if (page === "Resumes page") {
      expect(pageCommits[0].items).toHaveLength(2)
      expect(pageCommits[0].items?.every((title) => title.startsWith("Engineer"))).toBe(true)
    }
    read.mockRestore()
    await act(async () => {
      await router.navigate("/profile")
    })
    await screen.findByRole("heading", { name: "Profile page" })
  }
})

it("continues reacting to writes and reads fresh data on later visits", async () => {
  const router = await startAtProfile()
  await act(async () => {
    await router.navigate("/resumes")
  })
  await screen.findByRole("heading", { name: "Resumes page" })
  await act(async () => {
    await db.resumes.update("resume-0", { title: "Updated while viewing" })
    await settingsStore.upsertSettings({
      documents: { defaultResumeTitleFormat: "Updated setting" },
    })
  })
  expect(await screen.findByText("Updated while viewing")).toBeInTheDocument()
  expect(await screen.findByText("Updated setting")).toBeInTheDocument()
  await act(async () => {
    await router.navigate("/profile")
  })
  await db.resumes.update("resume-0", { title: "Updated while away" })
  commits.length = 0
  await act(async () => {
    await router.navigate("/resumes")
  })
  await screen.findByRole("heading", { name: "Resumes page" })
  expect(commits.find((commit) => commit.page === "Resumes page")?.items).toContain(
    "Updated while away",
  )
  expect(commits.every((commit) => commit.loaded)).toBe(true)
})
