import "fake-indexeddb/auto"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { beforeEach, describe, expect, it } from "vitest"
import { ModalProvider } from "@/components/modal"
import { db } from "@/db/db"
import { createTag } from "@/db/tag"
import TagsPage from "@/pages/tags/TagsPage"

beforeEach(async () => {
  await db.tags.clear()
})

function renderPage() {
  return render(
    <ModalProvider>
      <MemoryRouter initialEntries={["/tags"]}>
        <Routes>
          <Route path="/tags" element={<TagsPage />} />
        </Routes>
      </MemoryRouter>
    </ModalProvider>,
  )
}

describe("TagsPage", () => {
  it("searches, selects, and bulk deletes tags through the shared table", async () => {
    const alphaId = await createTag({ name: "Alpha", description: "First", colour: "#abc" })
    await createTag({ name: "Beta", description: "Second", colour: "#def" })
    const user = userEvent.setup()

    renderPage()

    expect(await screen.findByText("Alpha")).toBeInTheDocument()
    expect(screen.getByPlaceholderText("Search tags")).toBeInTheDocument()
    expect(screen.getByRole("columnheader", { name: "Tag" })).toBeInTheDocument()
    expect(screen.getByText("First")).toBeInTheDocument()

    await user.type(screen.getByPlaceholderText("Search tags"), "Beta")
    await waitFor(() => expect(screen.queryByText("Alpha")).not.toBeInTheDocument(), {
      timeout: 3000,
    })
    expect(screen.getByText("Beta")).toBeInTheDocument()

    await user.click(screen.getByRole("checkbox", { name: "Select Beta" }))
    const deleteButton = screen.getByRole("button", { name: "Delete selected tags" })
    expect(deleteButton).toBeEnabled()
    await user.click(deleteButton)

    expect(await screen.findByRole("heading", { name: "Delete 1 tag?" })).toBeInTheDocument()
    expect(
      screen.getByText(/remove the selected tags from every resume and cover letter/i),
    ).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Delete 1 tag" }))

    await waitFor(async () => expect(await db.tags.get(alphaId)).toBeDefined())
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
    expect(await db.tags.count()).toBe(1)
  })
})
