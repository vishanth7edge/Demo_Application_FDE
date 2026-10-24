import { Navigate, Outlet } from 'react-router'

import { useAuth } from './useAuth.ts'

export default function ProtectedRoute(): React.JSX.Element {
  const { user } = useAuth()
  return user === null ? <Navigate to="/login" replace /> : <Outlet />
}
