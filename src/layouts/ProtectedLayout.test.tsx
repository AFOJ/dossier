import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { createMemoryRouter, RouterProvider } from "react-router-dom"
import { afterEach, expect, it, vi } from "vitest"
import { createAppRoutes } from "@/routeConfig"
import { getProfile } from "@/db/profile"
import { getResume } from "@/db/resume"

vi.mock("@/db/profile", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/db/profile")>()),
  getProfile: vi.fn(),
}))
vi.mock("@/db/resume", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/db/resume")>()),
  getResume: vi.fn(),
}))
vi.mock("@/pages/resumes/edit", () => ({
  default: () => {
    throw new Error("Unexpected editor failure")
  },
}))
vi.mock("@/pages/resumes/list", () => ({ default: () => <div>Resumes list</div> }))

afterEach(() => {
  vi.restoreAllMocks()
  vi.resetAllMocks()
})

it.each(["render", "loader"])(
  "production routes keep navigation usable after a page %s error",
  async (failure) => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    vi.mocked(getProfile).mockResolvedValue({
      full_name: "Test User",
      role: null,
      email: null,
      phone: null,
      location: null,
      links: [],
    })
    if (failure === "loader")
      vi.mocked(getResume).mockRejectedValueOnce(new Error("Unexpected loader failure"))
    else
      vi.mocked(getResume).mockResolvedValueOnce({
        id: "resume-1",
        title: "Resume",
        sections: [],
        tagIds: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    const user = userEvent.setup()
    const router = createMemoryRouter(createAppRoutes(), {
      initialEntries: ["/resumes/resume-1/edit"],
    })
    render(<RouterProvider router={router} />)
    expect(
      await screen.findByRole("heading", { name: "Something went wrong" }, { timeout: 5000 }),
    ).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Refresh page" })).toBeInTheDocument()
    expect(screen.getAllByRole("main")).toHaveLength(1)
    await user.click(screen.getAllByRole("link", { name: /Resumes/i })[0])
    expect(await screen.findByText("Resumes list")).toBeInTheDocument()
    expect(screen.queryByRole("heading", { name: "Something went wrong" })).not.toBeInTheDocument()
  },
)
