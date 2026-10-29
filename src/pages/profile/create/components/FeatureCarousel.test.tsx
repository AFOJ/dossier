import { act, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, expect, it, vi } from "vitest"
import { FeatureCarousel } from "./FeatureCarousel"

function mockMedia(reducedMotion = false) {
  vi.spyOn(window, "matchMedia").mockImplementation((query) => ({
    matches: query.includes("min-width") || reducedMotion,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
}

beforeEach(() => {
  vi.useFakeTimers()
  mockMedia()
})
afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

it("keeps rotating on hover, pauses for keyboard interaction, and supports explicit restart", () => {
  const { container, unmount } = render(<FeatureCarousel />)
  expect(container.querySelector("#onboarding-feature svg")).toBeInTheDocument()
  expect(container.querySelector("#onboarding-feature img")).not.toBeInTheDocument()
  act(() => vi.advanceTimersByTime(6000))
  expect(screen.getByRole("heading")).toHaveTextContent("Your work goes with you.")
  expect(container.querySelector("#onboarding-feature svg")).toHaveAttribute(
    "viewBox",
    "0 0 103 128",
  )
  const carousel = screen.getByRole("region", { name: "Dossier features" })
  fireEvent.mouseEnter(carousel)
  act(() => vi.advanceTimersByTime(6000))
  expect(screen.getByRole("heading")).toHaveTextContent("Your career. Your data.")
  fireEvent.mouseLeave(carousel)
  const pointerSelect = (button: HTMLElement) => {
    fireEvent.pointerDown(button)
    fireEvent.focus(button)
    fireEvent.pointerUp(button)
    fireEvent.click(button)
  }
  act(() => vi.advanceTimersByTime(2000))
  pointerSelect(screen.getByRole("button", { name: /Show feature 3/ }))
  expect(screen.getByRole("button", { name: "Pause carousel" })).toBeInTheDocument()
  act(() => vi.advanceTimersByTime(5999))
  expect(screen.getByRole("heading")).toHaveTextContent("Your career. Your data.")
  act(() => vi.advanceTimersByTime(1))
  expect(screen.getByRole("heading")).toHaveTextContent("Your details, ready to reuse.")
  pointerSelect(screen.getByRole("button", { name: /Show feature 2/ }))
  act(() => vi.advanceTimersByTime(5999))
  expect(screen.getByRole("heading")).toHaveTextContent("Your work goes with you.")
  act(() => vi.advanceTimersByTime(1))
  expect(screen.getByRole("heading")).toHaveTextContent("Your career. Your data.")
  fireEvent.focus(screen.getByRole("button", { name: /Show feature 1/ }))
  act(() => vi.advanceTimersByTime(12000))
  expect(screen.getByRole("heading")).toHaveTextContent("Your career. Your data.")
  expect(document.getElementById("onboarding-feature")).toHaveAttribute("aria-live", "polite")
  fireEvent.click(screen.getByRole("button", { name: "Start carousel" }))
  expect(document.getElementById("onboarding-feature")).toHaveAttribute("aria-live", "off")
  act(() => vi.advanceTimersByTime(6000))
  expect(screen.getByRole("heading")).toHaveTextContent("Your details, ready to reuse.")
  unmount()
  expect(vi.getTimerCount()).toBe(0)
})

it("keeps reduced-motion playback manual while retaining slide selection", () => {
  mockMedia(true)
  render(<FeatureCarousel />)
  act(() => vi.advanceTimersByTime(6500))
  expect(screen.getByRole("heading")).toHaveTextContent("Your details, ready to reuse.")
  expect(screen.queryByRole("button", { name: /carousel/ })).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole("button", { name: /Show feature 2/ }))
  expect(screen.getByRole("heading")).toHaveTextContent("Your work goes with you.")
})
