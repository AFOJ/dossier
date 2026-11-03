import type { LoaderFunctionArgs, ShouldRevalidateFunction } from "react-router-dom"
import { takePrefetchedRouteData } from "@/lib/routePrefetch"
import { initialPageDataPrefetchKey, loadInitialPageData } from "@/loaders/prefetchInitialPageData"
import type { InitialPageData } from "@/hooks/useInitialPageData"

async function loadPageData({ request }: LoaderFunctionArgs): Promise<InitialPageData> {
  const url = new URL(request.url)
  const prefetched = takePrefetchedRouteData<InitialPageData>(initialPageDataPrefetchKey(url))
  if (prefetched) {
    return prefetched
  }

  return loadInitialPageData(url)
}

export const settingsPageLoader = loadPageData
export const resumesPageLoader = loadPageData
export const coverLettersPageLoader = loadPageData
export const tagsPageLoader = loadPageData

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
