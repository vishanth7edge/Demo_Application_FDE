import { useCallback, useId, useState } from 'react'
import { Outlet } from 'react-router'

import { CartLink } from '../../domains/cart/index.ts'
import { Header } from './Header.tsx'
import { Sidebar } from './Sidebar.tsx'

export type AppLayoutProps = Record<string, never>

// Layout route for logged-in pages: full-height sidebar, then the header above the page in <main>.
export function AppLayout(): React.JSX.Element {
  const sidebarId = useId()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const toggleSidebar = useCallback((): void => {
    setIsSidebarOpen((open) => !open)
  }, [])
  const closeSidebar = useCallback((): void => {
    setIsSidebarOpen(false)
  }, [])

  return (
    <div className="flex h-dvh bg-surface-muted font-poppins text-on-surface">
      <Sidebar id={sidebarId} isOpen={isSidebarOpen} onClose={closeSidebar} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          sidebarId={sidebarId}
          isMenuOpen={isSidebarOpen}
          onMenuToggle={toggleSidebar}
          actions={<CartLink />}
        />
        <main className="min-h-0 flex-1 overflow-y-auto p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
