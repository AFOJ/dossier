import { prefetchInitialPageData } from "@/loaders/prefetchInitialPageData"

const pageModules: Record<string, () => Promise<unknown>> = {
  "/resumes": () => import("@/pages/resumes/list"),
  "/resumes/create": () => import("@/pages/resumes/create"),
  "/cover-letters": () => import("@/pages/cover-letters/list"),
  "/cover-letters/create": () => import("@/pages/cover-letters/create"),
  "/profile": () => import("@/pages/profile/view"),
  "/tags": () => import("@/pages/tags"),
  "/settings": () => import("@/pages/settings"),
}

/** Warms the code and loader data for a likely sidebar destination. */
export function prefetchNavigation(to: string) {
  const url = new URL(to, window.location.origin)
  const loadPageModule = pageModules[url.pathname]
  if (!loadPageModule) {
    return
  }

  void loadPageModule()
  prefetchInitialPageData(url)
}
