import { createBrowserRouter, RouterProvider } from "react-router-dom"
import { createAppRoutes } from "@/routeConfig"

const router = createBrowserRouter(createAppRoutes())

export default function AppRoutes() {
  return <RouterProvider router={router} />
}
