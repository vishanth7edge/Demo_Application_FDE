import { Navigate, Outlet } from 'react-router'

import { useAuth } from '../context/useAuth.ts'
import { AppShellSkeleton } from './layout/AppShellSkeleton.tsx'

export type ProtectedRouteProps = Record<string, never>

// Layout route: renders the child route only for a logged-in user.
export function ProtectedRoute(): React.JSX.Element {
  const { status } = useAuth()

  switch (status) {
    case 'restoring':
      return <AppShellSkeleton />
    case 'anonymous':
      return <Navigate to="/login" replace />
    case 'authenticated':
      return <Outlet />
  }
}
