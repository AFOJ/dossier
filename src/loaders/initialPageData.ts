import type { LoaderFunctionArgs, ShouldRevalidateFunction } from "react-router-dom"
import { db } from "@/db/db"
import { getSettings } from "@/db/settings"
import { queryResumes } from "@/db/resume"
import { queryCoverLetters } from "@/db/coverLetter"
import { listTags } from "@/db/tag"
import { listQueryKey, readListQuery } from "@/lib/listQuery"
import type { InitialPageData } from "@/hooks/useInitialPageData"

export async function settingsPageLoader(): Promise<InitialPageData> {
  return { settings: await getSettings() }
}

export async function resumesPageLoader({ request }: LoaderFunctionArgs): Promise<InitialPageData> {
  const query = readListQuery(new URL(request.url).searchParams)
  const [settings, result, totalDbCount] = await Promise.all([
    getSettings(),
    queryResumes(query),
    db.resumes.count(),
  ])
  return { settings, resumes: { query: { key: listQueryKey(query), result }, totalDbCount } }
}

export async function coverLettersPageLoader({
  request,
}: LoaderFunctionArgs): Promise<InitialPageData> {
  const query = readListQuery(new URL(request.url).searchParams)
  const [settings, result, totalDbCount] = await Promise.all([
    getSettings(),
    queryCoverLetters(query),
    db.coverLetters.count(),
  ])
  return { settings, coverLetters: { query: { key: listQueryKey(query), result }, totalDbCount } }
}

export async function tagsPageLoader(): Promise<InitialPageData> {
  const [settings, tags] = await Promise.all([getSettings(), listTags()])
  return { settings, tags }
}

/** Search and pagination already refresh through the mounted live query. */
export const initialListShouldRevalidate: ShouldRevalidateFunction = ({
  currentUrl,
  nextUrl,
  defaultShouldRevalidate,
}) => {
  if (currentUrl.pathname === nextUrl.pathname && currentUrl.search !== nextUrl.search) {
    return false
  }
  return defaultShouldRevalidate
}
