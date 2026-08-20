import { useRouteLoaderData } from 'react-router-dom'
import type { Profile } from '@/db/db'

export interface ProtectedRouteData {
  profile: Profile
}
export default function useProtectedRouteData(): ProtectedRouteData {
  const data = useRouteLoaderData<ProtectedRouteData>('protected')

  if (!data) {
    throw new Error(
      `useProtectedRouteData must be used within a protected route`,
    )
  }

  return data
}
