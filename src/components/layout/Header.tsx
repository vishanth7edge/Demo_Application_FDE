import { Link, useLocation } from 'react-router'

import { MenuIcon } from '../Icons.tsx'
import { getBreadcrumbs } from './navItems.ts'
import { SIDEBAR_ID } from './Sidebar.tsx'

export interface HeaderProps {
  menuOpen: boolean
  onMenuClick: () => void
}

export default function Header({ menuOpen, onMenuClick }: HeaderProps): React.JSX.Element {
  const { pathname } = useLocation()
  const crumbs = getBreadcrumbs(pathname)

  return (
    <header className="flex h-14 items-center justify-between gap-4 border-b border-outline-variant bg-surface px-4 md:px-5">
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Menu"
          aria-expanded={menuOpen}
          aria-controls={SIDEBAR_ID}
          className="rounded-md p-1 text-on-surface hover:bg-surface-container-high focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none md:hidden"
        >
          <MenuIcon />
        </button>
        <nav aria-label="Breadcrumb">
          <ol className="flex items-center gap-2 text-label-medium">
            {crumbs.map((crumb, index) => (
              <li key={crumb.label} className="flex items-center gap-2">
                {index > 0 && (
                  <span aria-hidden="true" className="text-outline-variant">
                    •
                  </span>
                )}
                {crumb.to === undefined ? (
                  <span
                    aria-current={index === crumbs.length - 1 ? 'page' : undefined}
                    className="text-primary"
                  >
                    {crumb.label}
                  </span>
                ) : (
                  <Link to={crumb.to} className="text-on-surface hover:underline">
                    {crumb.label}
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </nav>
      </div>
    </header>
  )
}
