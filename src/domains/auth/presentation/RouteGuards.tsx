import { Navigate, Outlet, useLocation } from 'react-router'

import type { UserRole } from '../application/index.ts'
import { flashState } from '../../../shared/feedback/flash.ts'
import { FullPageSpinner } from '../../../shared/ui/Spinner.tsx'
import { useAuth } from './useAuth.ts'

export type RequireAuthProps = Record<string, never>

/** Renders child routes for signed-in users; everyone else goes to /login. */
export function RequireAuth(_props: RequireAuthProps): React.JSX.Element {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'checking') {
    return <FullPageSpinner label="Checking your session" />
  }
  if (status === 'anonymous') {
    return (
      <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />
    )
  }
  return <Outlet />
}

export interface RequireRoleProps {
  role: UserRole
  redirectTo: string
  message: string
}

/** Renders child routes only for users with `role`; others are sent to `redirectTo`. */
export function RequireRole({ role, redirectTo, message }: RequireRoleProps): React.JSX.Element {
  const { user } = useAuth()
  if (user?.role !== role) {
    return <Navigate to={redirectTo} replace state={flashState(message, 'error')} />
  }
  return <Outlet />
}

export type RedirectIfAuthenticatedProps = Record<string, never>

/**
 * Public-only routes (login, forgot password). Signed-in users — including someone who has just
 * signed in — continue to the page that sent them to /login, or the dashboard.
 */
export function RedirectIfAuthenticated(_props: RedirectIfAuthenticatedProps): React.JSX.Element {
  const { status } = useAuth()
  if (status === 'checking') {
    return <FullPageSpinner label="Checking your session" />
  }
  if (status === 'authenticated') {
    return <Navigate to="/dashboard" replace />
  }
  return <Outlet />
}
