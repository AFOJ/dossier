import { createBrowserRouter, createRoutesFromElements, Route, RouterProvider } from "react-router-dom"


const router = createBrowserRouter(
    createRoutesFromElements(
        <Route path="/" element={<div className="text-xl p-4 font-heading font-light">Dossier</div>}>
        </Route>
    )
)

export default function AppRoutes() {
    return <RouterProvider router={router} />
}