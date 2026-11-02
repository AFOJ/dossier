import { beforeEach, expect, it, vi } from "vitest"
import { db } from "@/db/db"
import * as settingsStore from "@/db/settings"
import { resumesPageLoader } from "@/loaders/initialPageData"
import { prefetchInitialPageData } from "@/loaders/prefetchInitialPageData"
import { clearRoutePrefetches } from "@/lib/routePrefetch"

const RESUMES_URL = "http://localhost/resumes"

beforeEach(async () => {
  clearRoutePrefetches()
  vi.restoreAllMocks()
  await Promise.all([db.resumes.clear(), db.tags.clear(), db.settings.clear()])
})

it("lets the matching loader reuse prefetched resume data once", async () => {
  const getSettings = vi.spyOn(settingsStore, "getSettings")
  const url = new URL(RESUMES_URL)

  await prefetchInitialPageData(url)
  await resumesPageLoader({ request: new Request(RESUMES_URL) } as never)

  expect(getSettings).toHaveBeenCalledOnce()
})

it("leaves unrelated loader URLs to perform their own read", async () => {
  const getSettings = vi.spyOn(settingsStore, "getSettings")

  await prefetchInitialPageData(new URL(RESUMES_URL))
  await resumesPageLoader({ request: new Request(`${RESUMES_URL}?query=Engineer`) } as never)

  expect(getSettings).toHaveBeenCalledTimes(2)
})

it("does not attempt to prefetch data for a code-only route", () => {
  expect(prefetchInitialPageData(new URL("http://localhost/profile"))).toBeUndefined()
})

it.each(["/resumes/", "/RESUMES"])("prefetches data for the normalized route %s", async (path) => {
  const getSettings = vi.spyOn(settingsStore, "getSettings")
  const url = `http://localhost${path}`

  await prefetchInitialPageData(new URL(url))
  await resumesPageLoader({ request: new Request(url) } as never)

  expect(getSettings).toHaveBeenCalledOnce()
})
