import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { createMemoryRouter, Outlet, RouterProvider } from "react-router-dom"
import { afterEach, expect, it, vi } from "vitest"
import ProtectedLayout from "./ProtectedLayout"
import { ErrorBoundary } from "@/components/ErrorBoundary"

function BrokenPage(): never {
  throw new Error("Unexpected editor failure")
}

afterEach(() => vi.restoreAllMocks())

it.each(["render", "loader"])("keeps navigation usable after a page %s error", async (failure) => {
  vi.spyOn(console, "error").mockImplementation(() => {})
  const user = userEvent.setup()
  const router = createMemoryRouter(
    [
      {
        id: "protected",
        path: "/",
        element: <ProtectedLayout />,
        loader: () => ({
          profile: {
            full_name: "Test User",
            role: null,
            email: null,
            phone: null,
            location: null,
            links: [],
          },
        }),
        hydrateFallbackElement: <div>Loading</div>,
        children: [
          {
            element: <Outlet />,
            errorElement: <ErrorBoundary embedded />,
            children: [
              {
                path: "broken",
                element: failure === "render" ? <BrokenPage /> : <div>Editor</div>,
                loader:
                  failure === "loader"
                    ? () => {
                        throw new Error("Unexpected loader failure")
                      }
                    : undefined,
              },
              { path: "resumes", element: <div>Resumes list</div> },
            ],
          },
        ],
      },
    ],
    { initialEntries: ["/broken"] },
  )
  render(<RouterProvider router={router} />)
  expect(await screen.findByRole("heading", { name: "Something went wrong" })).toBeInTheDocument()
  expect(screen.getByRole("button", { name: "Refresh page" })).toBeInTheDocument()
  expect(screen.getAllByRole("main")).toHaveLength(1)
  await user.click(screen.getAllByRole("link", { name: /Resumes/i })[0])
  expect(await screen.findByText("Resumes list")).toBeInTheDocument()
  expect(screen.queryByRole("heading", { name: "Something went wrong" })).not.toBeInTheDocument()
})
