import { afterEach, expect, it, vi } from "vitest"
import {
  clearRoutePrefetches,
  prefetchRouteData,
  takePrefetchedRouteData,
} from "@/lib/routePrefetch"

afterEach(() => {
  clearRoutePrefetches()
  vi.useRealTimers()
})

it("shares a prefetched read and lets one navigation consume it", async () => {
  const load = vi.fn().mockResolvedValue({ value: "prefetched" })

  const first = prefetchRouteData("resumes", load)
  const second = prefetchRouteData("resumes", load)
  const consumed = takePrefetchedRouteData<{ value: string }>("resumes")

  expect(load).toHaveBeenCalledOnce()
  expect(first).toBe(second)
  expect(consumed).toBe(first)
  await expect(consumed).resolves.toEqual({ value: "prefetched" })
  expect(takePrefetchedRouteData("resumes")).toBeUndefined()
})

it("does not reuse an expired result", () => {
  vi.useFakeTimers()
  const load = vi.fn().mockResolvedValue("prefetched")

  prefetchRouteData("resumes", load)
  vi.advanceTimersByTime(3_000)

  expect(takePrefetchedRouteData("resumes")).toBeUndefined()
})
