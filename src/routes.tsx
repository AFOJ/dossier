import {
  createBrowserRouter,
  RouterProvider,
  createRoutesFromElements,
  Route,
  redirect,
  Outlet,
  Navigate,
} from 'react-router-dom'
import { getProfile } from './db/profile'
import type { ProtectedRouteData } from './hooks/useProtectedRouteData'
import CreateProfilePage from './pages/profile/create'
import ProtectedLayout from './layouts/ProtectedLayout'
import { ErrorBoundary } from './components/ErrorBoundary'

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
        <Route path="setup" element={<CreateProfilePage />} />
      </Route>

      <Route
        id="protected"
        element={<ProtectedLayout />}
        loader={protectedRouteLoader}
      >
        <Route index element={<Navigate to="resumes" replace />} />
        <Route path="resumes">
          <Route index element={<>List of resumes</>} />
          <Route path="create" element={<>Create resume</>} />
          <Route path="upload" element={<>Upload resume</>} />
        </Route>
        <Route path="profile" element={<>Profile</>} />
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
