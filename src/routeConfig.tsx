import { createRoutesFromElements, Route, redirect, Outlet } from "react-router-dom"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { ModalProvider } from "@/components/modal"
import { Toaster } from "@/components/toast"
import { getProfile } from "@/db/profile"
import { getCoverLetter } from "@/db/coverLetter"
import { getResume } from "@/db/resume"
import type { ProtectedRouteData } from "@/hooks/useProtectedRouteData"
import ProtectedLayout from "@/layouts/ProtectedLayout"

const protectedRouteLoader = async () => {
  const profile = await getProfile()

  if (!profile) {
    return redirect("/setup")
  }

  return { profile } satisfies ProtectedRouteData
}

const landingRouteLoader = async () => {
  const profile = await getProfile()

  return { hasProfile: Boolean(profile) }
}

const publicOnlyRouteLoader = async () => {
  const profile = await getProfile()

  if (profile) {
    return redirect("/resumes")
  }

  return null
}

const resumeEditRouteId = "resume-edit"

const resumeEditRouteLoader = async ({ params }: { params: { resumeId?: string } }) => {
  const resume = await getResume(params.resumeId ?? "")

  if (!resume) {
    return redirect("/resumes")
  }

  return { resume }
}

const coverLetterEditRouteLoader = async ({ params }: { params: { coverLetterId?: string } }) => {
  const coverLetter = await getCoverLetter(params.coverLetterId ?? "")

  if (!coverLetter) {
    return redirect("/cover-letters")
  }

  return { coverLetter }
}

export function createAppRoutes() {
  const PublicOnlyLayout = () => <Outlet />

  function HydrateFallback() {
    return (
      <div className="grid min-h-dvh place-items-center bg-white">
        <div
          role="status"
          aria-label="Loading page"
          className="size-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600 motion-reduce:animate-none"
        />
      </div>
    )
  }

  function RootLayout() {
    return (
      <ModalProvider>
        <Outlet />
        <Toaster />
      </ModalProvider>
    )
  }

  return createRoutesFromElements(
    <Route path="/" element={<RootLayout />} errorElement={<ErrorBoundary />}>
      <Route
        index
        lazy={async () => ({ Component: (await import("@/pages/landing")).default })}
        loader={landingRouteLoader}
        hydrateFallbackElement={<HydrateFallback />}
      />

      <Route
        element={<PublicOnlyLayout />}
        loader={publicOnlyRouteLoader}
        hydrateFallbackElement={<HydrateFallback />}
      >
        <Route
          path="setup"
          lazy={async () => ({ Component: (await import("@/pages/profile/create")).default })}
        />
      </Route>

      <Route
        id="protected"
        element={<ProtectedLayout />}
        loader={protectedRouteLoader}
        hydrateFallbackElement={<HydrateFallback />}
      >
        <Route element={<Outlet />} errorElement={<ErrorBoundary embedded />}>
          <Route path="resumes">
            <Route
              index
              lazy={async () => ({ Component: (await import("@/pages/resumes/list")).default })}
            />
            <Route
              path="create"
              lazy={async () => ({ Component: (await import("@/pages/resumes/create")).default })}
            />
            <Route
              path="upload"
              lazy={async () => ({ Component: (await import("@/pages/resumes/upload")).default })}
            />
            <Route
              id={resumeEditRouteId}
              path=":resumeId/edit"
              loader={resumeEditRouteLoader}
              lazy={async () => ({ Component: (await import("@/pages/resumes/edit")).default })}
            />
          </Route>
          <Route path="cover-letters">
            <Route
              index
              lazy={async () => ({
                Component: (await import("@/pages/cover-letters/list")).default,
              })}
            />
            <Route
              path="create"
              lazy={async () => ({
                Component: (await import("@/pages/cover-letters/create")).default,
              })}
            />
            <Route
              path="upload"
              lazy={async () => ({
                Component: (await import("@/pages/cover-letters/upload")).default,
              })}
            />
            <Route
              id="cover-letter-edit"
              path=":coverLetterId/edit"
              loader={coverLetterEditRouteLoader}
              lazy={async () => ({
                Component: (await import("@/pages/cover-letters/edit")).default,
              })}
            />
          </Route>
          <Route
            path="profile"
            lazy={async () => ({ Component: (await import("@/pages/profile/view")).default })}
          />
          <Route
            path="tags"
            lazy={async () => ({ Component: (await import("@/pages/tags")).default })}
          />
          <Route
            path="settings"
            lazy={async () => ({ Component: (await import("@/pages/settings")).default })}
          />
        </Route>
      </Route>

      <Route
        path="*"
        element={<div />}
        loader={() => {
          throw new Response("The page you are looking for doesn't exist or has been moved.", {
            status: 404,
            statusText: "Page not found",
          })
        }}
      />
    </Route>,
  )
}
