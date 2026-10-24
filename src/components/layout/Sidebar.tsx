import { NavLink } from 'react-router'

import { useEscapeKey } from '../useEscapeKey.ts'
import { DashboardIcon, ProductsIcon } from '../Icons.tsx'
import { NAV_ITEMS } from './navItems.ts'

export const SIDEBAR_ID = 'app-sidebar'

export interface SidebarProps {
  open: boolean
  onClose: () => void
}

const ICONS: Record<string, React.JSX.Element> = {
  '/dashboard': <DashboardIcon />,
  '/products': <ProductsIcon />,
}

export default function Sidebar({ open, onClose }: SidebarProps): React.JSX.Element {
  useEscapeKey(open, onClose)

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-20 bg-scrim/40 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        id={SIDEBAR_ID}
        aria-label="Sidebar"
        className={`fixed inset-y-0 left-0 z-30 flex w-64 flex-col gap-6 bg-surface-container-highest py-6 transition-transform md:sticky md:top-0 md:h-screen md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full max-md:invisible'
        }`}
      >
        <div className="border-b border-outline-variant px-6 pb-6">
          <img src="/old-town-logo.svg" alt="Old Town Market" className="h-15 w-auto" />
        </div>
        <nav aria-label="Main">
          <ul className="flex flex-col gap-2 pr-2">
            {NAV_ITEMS.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-r-lg border-l-2 px-6 py-3 text-label-large focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${
                      isActive
                        ? 'border-primary bg-surface-container-lowest text-primary'
                        : 'border-transparent text-on-surface-variant hover:bg-surface-container-high'
                    }`
                  }
                >
                  {ICONS[item.to]}
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  )
}
