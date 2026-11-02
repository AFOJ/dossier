import { db } from "@/db/db"
import { getSettings } from "@/db/settings"
import { queryResumes } from "@/db/resume"
import { queryCoverLetters } from "@/db/coverLetter"
import { listTags } from "@/db/tag"
import { listQueryKey, readListQuery } from "@/lib/listQuery"
import { prefetchRouteData } from "@/lib/routePrefetch"
import type { InitialPageData } from "@/hooks/useInitialPageData"

function normalizeInitialPagePath(pathname: string) {
  const path = pathname.toLowerCase().replace(/\/+$/, "")
  return path || "/"
}

export function initialPageDataPrefetchKey(url: URL) {
  return `initial-page-data:${normalizeInitialPagePath(url.pathname)}${url.search}`
}

async function loadSettingsPage(): Promise<InitialPageData> {
  return { settings: await getSettings() }
}

async function loadResumesPage(url: URL): Promise<InitialPageData> {
  const query = readListQuery(url.searchParams)
  const [settings, result, totalDbCount] = await Promise.all([
    getSettings(),
    queryResumes(query),
    db.resumes.count(),
  ])
  return { settings, resumes: { query: { key: listQueryKey(query), result }, totalDbCount } }
}

async function loadCoverLettersPage(url: URL): Promise<InitialPageData> {
  const query = readListQuery(url.searchParams)
  const [settings, result, totalDbCount] = await Promise.all([
    getSettings(),
    queryCoverLetters(query),
    db.coverLetters.count(),
  ])
  return { settings, coverLetters: { query: { key: listQueryKey(query), result }, totalDbCount } }
}

async function loadTagsPage(): Promise<InitialPageData> {
  const [settings, tags] = await Promise.all([getSettings(), listTags()])
  return { settings, tags }
}

const initialPageLoaders: Record<string, (url: URL) => Promise<InitialPageData>> = {
  "/resumes": loadResumesPage,
  "/cover-letters": loadCoverLettersPage,
  "/tags": () => loadTagsPage(),
  "/settings": () => loadSettingsPage(),
  "/resumes/create": () => loadSettingsPage(),
  "/cover-letters/create": () => loadSettingsPage(),
}

export function loadInitialPageData(url: URL): Promise<InitialPageData> {
  const pathname = normalizeInitialPagePath(url.pathname)
  const load = initialPageLoaders[pathname]
  if (!load) {
    throw new Error(`No initial page loader for ${url.pathname}.`)
  }
  return load(url)
}

/** Warms loader data only for destinations whose complete snapshot is known. */
export function prefetchInitialPageData(url: URL) {
  const pathname = normalizeInitialPagePath(url.pathname)
  if (!initialPageLoaders[pathname]) {
    return undefined
  }

  return prefetchRouteData(initialPageDataPrefetchKey(url), () => loadInitialPageData(url))
}
