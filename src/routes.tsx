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
import { ModalProvider } from '@/components/modal'
import { Toaster } from '@/components/toast'
import { getProfile } from '@/db/profile'
import type { ProtectedRouteData } from '@/hooks/useProtectedRouteData'
import ProtectedLayout from '@/layouts/ProtectedLayout'
import CreateProfilePage from '@/pages/profile/create'
import ProfilePage from '@/pages/profile/view'
import CreateResumePage from '@/pages/resumes/create'
import EditResumePage from '@/pages/resumes/edit'
import ResumesListPage from '@/pages/resumes/list'
import UploadResumePage from '@/pages/resumes/upload'
import ViewResumePage from '@/pages/resumes/view'

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

function RootLayout() {
  return (
    <ModalProvider>
      <Outlet />
      <Toaster />
    </ModalProvider>
  )
}

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<RootLayout />} errorElement={<ErrorBoundary />}>
      <Route element={<PublicOnlyLayout />} loader={publicOnlyRouteLoader}>
        <Route path="setup" element={<CreateProfilePage />} />
      </Route>

      <Route
        id="protected"
        element={<ProtectedLayout />}
        loader={protectedRouteLoader}
      >
        <Route index element={<Navigate to="resumes" replace />} />
        <Route path="resumes">
          <Route index element={<ResumesListPage />} />
          <Route path="create" element={<CreateResumePage />} />
          <Route path="upload" element={<UploadResumePage />} />
          <Route path=":resumeId" element={<ViewResumePage />} />
          <Route path=":resumeId/edit" element={<EditResumePage />} />
        </Route>
        <Route path="profile" element={<ProfilePage />} />
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
