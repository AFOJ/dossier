import { useRef } from "react"
import { useForm } from "react-hook-form"
import { act, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, expect, it, vi } from "vitest"
import { EditingContextBar } from "./EditingContextBar"

let intersectionCallback: IntersectionObserverCallback
let resizeCallback: ResizeObserverCallback
let headerHeight = 56
let observerOptions: IntersectionObserverInit | undefined
type ObserverRecord = { observe: ReturnType<typeof vi.fn>; disconnect: ReturnType<typeof vi.fn> }
let intersectionObservers: ObserverRecord[] = []
let resizeObservers: ObserverRecord[] = []
const renderForm = vi.fn()

function Harness() {
  renderForm()
  const form = useForm<{ title: string }>({ defaultValues: { title: "Saved document" } })
  const titleFieldRef = useRef<HTMLDivElement>(null)
  return (
    <>
      <header data-app-mobile-header="" />
      <EditingContextBar
        heading="Edit resume"
        control={form.control}
        fallbackTitle="Saved document"
        titleFieldRef={titleFieldRef}
        titleInputId="test-title"
      />
      <div ref={titleFieldRef}>
        <label htmlFor="test-title">Title</label>
        <input id="test-title" {...form.register("title")} />
      </div>
      <button>Outside</button>
    </>
  )
}

function scrollPastTitle(isPast: boolean) {
  act(() =>
    intersectionCallback(
      [
        {
          isIntersecting: !isPast,
          boundingClientRect: { bottom: isPast ? -1 : 100 },
        } as IntersectionObserverEntry,
      ],
      {} as IntersectionObserver,
    ),
  )
}

beforeEach(() => {
  intersectionObservers = []
  resizeObservers = []
  headerHeight = 56
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(callback: IntersectionObserverCallback, options: IntersectionObserverInit) {
        intersectionCallback = callback
        observerOptions = options
        intersectionObservers.push(this)
      }
      observe = vi.fn()
      disconnect = vi.fn()
    },
  )
  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(callback: ResizeObserverCallback) {
        resizeCallback = callback
        resizeObservers.push(this)
      }
      observe = vi.fn()
      disconnect = vi.fn()
    },
  )
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (
    this: HTMLElement,
  ) {
    return {
      height: this.hasAttribute("data-app-mobile-header") ? headerHeight : 64,
      bottom: 300,
    } as DOMRect
  })
  vi.spyOn(HTMLElement.prototype, "scrollIntoView").mockImplementation(() => {})
})
afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

it("shows context only above the title threshold, follows title edits, and measures header changes", async () => {
  const user = userEvent.setup()
  render(<Harness />)
  expect(screen.queryByRole("region", { name: "Document editing context" })).not.toBeInTheDocument()
  expect(observerOptions?.rootMargin).toBe("-56px 0px 0px 0px")
  scrollPastTitle(true)
  expect(screen.getByRole("region")).toHaveStyle({ top: "56px" })
  expect(screen.queryByRole("button", { name: /Show full title/ })).not.toBeInTheDocument()
  const formRendersBeforeTyping = renderForm.mock.calls.length
  await user.clear(screen.getByLabelText("Title"))
  expect(screen.getByRole("region")).toHaveTextContent("Saved document")
  await user.type(screen.getByLabelText("Title"), "Draft document")
  expect(screen.getByRole("region")).toHaveTextContent("Draft document")
  expect(renderForm).toHaveBeenCalledTimes(formRendersBeforeTyping)
  expect(intersectionObservers.at(-1)?.observe).toHaveBeenCalledWith(
    screen.getByLabelText("Title").parentElement,
  )
  expect(resizeObservers.at(-1)?.observe).toHaveBeenCalledWith(screen.getByRole("region"))
  expect(resizeObservers.at(-1)?.observe).toHaveBeenCalledWith(
    document.querySelector("[data-app-mobile-header]"),
  )
  headerHeight = 0
  act(() => resizeCallback([], {} as ResizeObserver))
  expect(observerOptions?.rootMargin).toBe("-0px 0px 0px 0px")
  expect(document.documentElement.style.scrollPaddingTop).toBe("76px")
  scrollPastTitle(false)
  expect(screen.queryByRole("region")).not.toBeInTheDocument()
})

it.each([false, true])(
  "keeps keyboard focus safe and returns to Title (reduced motion: %s)",
  async (reducedMotion) => {
    vi.spyOn(window, "matchMedia").mockReturnValue({ matches: reducedMotion } as MediaQueryList)
    const user = userEvent.setup()
    const { unmount } = render(<Harness />)
    scrollPastTitle(true)
    const returnButton = screen.getByRole("button", { name: "Back to top" })
    act(() => returnButton.focus())
    scrollPastTitle(false)
    expect(returnButton).toHaveFocus()
    expect(screen.getByRole("region")).toBeInTheDocument()
    await user.click(returnButton)
    expect(screen.getByLabelText("Title")).toHaveFocus()
    expect(screen.getByLabelText("Title").scrollIntoView).toHaveBeenCalledWith({
      block: "start",
      behavior: reducedMotion ? "instant" : "smooth",
    })
    expect(screen.queryByRole("region")).not.toBeInTheDocument()
    const activeIntersection = intersectionObservers.at(-1)!
    const contextBar = document.querySelector('[aria-label="Document editing context"]')!
    const activeResize = resizeObservers.findLast((observer) =>
      observer.observe.mock.calls.some(([target]) => target === contextBar),
    )!
    expect(activeIntersection.disconnect).not.toHaveBeenCalled()
    expect(activeResize.disconnect).not.toHaveBeenCalled()
    unmount()
    expect(document.documentElement.style.scrollPaddingTop).toBe("")
    expect(activeIntersection.disconnect).toHaveBeenCalledTimes(1)
    expect(activeResize.disconnect).toHaveBeenCalledTimes(1)
  },
)

it("exposes overflowing titles through a keyboard disclosure and resets it after hiding", async () => {
  vi.spyOn(HTMLElement.prototype, "scrollHeight", "get").mockReturnValue(100)
  const user = userEvent.setup()
  render(<Harness />)
  scrollPastTitle(true)
  const titleButton = screen.getByRole("button", {
    name: /Saved document.*Show full title/,
  })
  expect(titleButton).toHaveAttribute("aria-expanded", "false")
  const titleContent = screen.getByText("Saved document", { selector: "span" })
  expect(document.getElementById(titleButton.getAttribute("aria-controls")!)).toBe(titleContent)
  expect(titleContent).toHaveClass("line-clamp-2")
  act(() => titleButton.focus())
  await user.keyboard("{Enter}")
  expect(titleButton).toHaveAttribute("aria-expanded", "true")
  expect(titleContent).not.toHaveClass("line-clamp-2")
  expect(titleButton).toHaveFocus()
  await user.keyboard(" ")
  expect(titleButton).toHaveAttribute("aria-expanded", "false")
  expect(titleContent).toHaveClass("line-clamp-2")
  await user.keyboard("{Enter}")
  scrollPastTitle(false)
  expect(screen.getByRole("region")).toBeInTheDocument()
  await user.click(screen.getByRole("button", { name: "Outside" }))
  expect(screen.queryByRole("region")).not.toBeInTheDocument()
  scrollPastTitle(true)
  expect(screen.getByRole("button", { name: /Show full title/ })).toHaveAttribute(
    "aria-expanded",
    "false",
  )
})
