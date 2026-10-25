import { Outlet } from 'react-router'

import { getRoleLabel, useAuth } from '../domains/auth/index.ts'
import { AppShell } from '../shared/layout/AppShell.tsx'
import type { NavItem } from '../shared/layout/SidebarContent.tsx'
import { IconBox, IconDashboard } from '../shared/ui/Icons.tsx'
import { FullPageSpinner } from '../shared/ui/Spinner.tsx'

const NAVIGATION: readonly NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: <IconDashboard /> },
  { to: '/products', label: 'Products', icon: <IconBox /> },
]

export type AuthenticatedLayoutProps = Record<string, never>

/** Sidebar frame around every signed-in page. */
export function AuthenticatedLayout(_props: AuthenticatedLayoutProps): React.JSX.Element {
  const { user, signOut } = useAuth()

  if (user === null) {
    return <FullPageSpinner />
  }

  const handleLogout = (): void => {
    void signOut()
  }

  return (
    <AppShell
      navigation={NAVIGATION}
      user={{ name: user.name, detail: getRoleLabel(user) }}
      onLogout={handleLogout}
    >
      <Outlet />
    </AppShell>
  )
}
