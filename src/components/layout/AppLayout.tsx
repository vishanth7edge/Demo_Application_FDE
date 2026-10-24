import { useCallback, useState } from 'react'
import { Outlet } from 'react-router'

import Header from './Header.tsx'
import Sidebar from './Sidebar.tsx'

export default function AppLayout(): React.JSX.Element {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const closeSidebar = useCallback(() => {
    setSidebarOpen(false)
  }, [])

  return (
    <div className="flex min-h-screen bg-surface-container-low font-poppins text-on-surface">
      <Sidebar open={sidebarOpen} onClose={closeSidebar} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          menuOpen={sidebarOpen}
          onMenuClick={() => {
            setSidebarOpen((open) => !open)
          }}
        />
        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
