import { lazy, Suspense } from 'react'
import {
  createBrowserRouter,
  RouterProvider,
  createRoutesFromElements,
  Route,
  redirect,
  Outlet,
  Navigate,
} from 'react-router-dom'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { getProfile } from '@/db/profile'
import type { ProtectedRouteData } from '@/hooks/useProtectedRouteData'
import ProtectedLayout from '@/layouts/ProtectedLayout'

const CreateProfilePage = lazy(() => import('@/pages/profile/create'))
const ProfilePage = lazy(() => import('@/pages/profile/view'))
const CreateResumePage = lazy(() => import('@/pages/resumes/create'))
const EditResumePage = lazy(() => import('@/pages/resumes/edit'))
const ResumesListPage = lazy(() => import('@/pages/resumes/list'))
const UploadResumePage = lazy(() => import('@/pages/resumes/upload'))
const ViewResumePage = lazy(() => import('@/pages/resumes/view'))

function RouteSuspense(props: Readonly<{ children: React.ReactNode }>) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <div
            role="status"
            aria-label="Loading page"
            className="size-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"
          />
        </div>
      }
    >
      {props.children}
    </Suspense>
  )
}

const protectedRouteLoader = async () => {
  const profile = await getProfile()

  if (!profile) {
    return redirect('/setup')
  }

  return { profile } satisfies ProtectedRouteData
}

const publicOnlyRouteLoader = async () => {
  const profile = await getProfile()

  if (profile) {
    return redirect('/resumes')
  }

  return null
}

const PublicOnlyLayout = () => <Outlet />

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<Outlet />} errorElement={<ErrorBoundary />}>
      <Route element={<PublicOnlyLayout />} loader={publicOnlyRouteLoader}>
        <Route
          path="setup"
          element={
            <RouteSuspense>
              <CreateProfilePage />
            </RouteSuspense>
          }
        />
      </Route>

      <Route
        id="protected"
        element={<ProtectedLayout />}
        loader={protectedRouteLoader}
      >
        <Route index element={<Navigate to="resumes" replace />} />
        <Route path="resumes">
          <Route
            index
            element={
              <RouteSuspense>
                <ResumesListPage />
              </RouteSuspense>
            }
          />
          <Route
            path="create"
            element={
              <RouteSuspense>
                <CreateResumePage />
              </RouteSuspense>
            }
          />
          <Route
            path="upload"
            element={
              <RouteSuspense>
                <UploadResumePage />
              </RouteSuspense>
            }
          />
          <Route
            path=":resumeId"
            element={
              <RouteSuspense>
                <ViewResumePage />
              </RouteSuspense>
            }
          />
          <Route
            path=":resumeId/edit"
            element={
              <RouteSuspense>
                <EditResumePage />
              </RouteSuspense>
            }
          />
        </Route>
        <Route
          path="profile"
          element={
            <RouteSuspense>
              <ProfilePage />
            </RouteSuspense>
          }
        />
      </Route>

      <Route
        path="*"
        element={<div />}
        loader={() => {
          throw new Response(
            "The page you are looking for doesn't exist or has been moved.",
            { status: 404, statusText: 'Page not found' },
          )
        }}
      />
    </Route>,
  ),
)

export default function AppRoutes() {
  return <RouterProvider router={router} />
}
