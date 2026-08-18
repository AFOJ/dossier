import { createBrowserRouter, RouterProvider, createRoutesFromElements, Route, redirect, Outlet, Navigate } from "react-router-dom"
import { getProfile } from "./db/profile"
import type { ProtectedRouteData } from "./hooks/useProtectedRouteData"

const protectedRouteLoader = async () => {
    const profile = await getProfile()

    if (!profile) {
        return redirect("/setup")
    }

    return { profile } satisfies ProtectedRouteData
}

const publicOnlyRouteLoader = async () => {
    const profile = await getProfile()

    if (profile) {
        return redirect("/resumes")
    }

    return null
}

const PublicOnlyLayout = () => <Outlet />
const ProtectedLayout = () => <Outlet />


const router = createBrowserRouter(
    createRoutesFromElements(
        <Route path="/" element={<Outlet />}>

            <Route id="protected" element={<PublicOnlyLayout />} loader={publicOnlyRouteLoader}>
                <Route path="setup" element={<>Setup your profile</>} />
            </Route>

            <Route element={<ProtectedLayout />} loader={protectedRouteLoader}>
                <Route index element={<Navigate to="resumes" replace />} />
                <Route path="resumes" element={<>List of resumes</>} />
                <Route path="profile" element={<>Profile</>} />
            </Route>

            <Route path="*" element={<>Page not found</>} />
        </Route>
    )
)

export default function AppRoutes() {
    return <RouterProvider router={router} />
}