import { Link, useMatches } from 'react-router'

import { getRouteBreadcrumb } from '../../helpers/routeTitle.ts'
import { BellIcon, MenuIcon } from '../icons/UiIcons.tsx'

export interface HeaderProps {
  sidebarId: string
  isMenuOpen: boolean
  onMenuToggle: () => void
  // Extra buttons before the bell (the app passes the cart link).
  actions?: React.ReactNode
}

export function Header({
  sidebarId,
  isMenuOpen,
  onMenuToggle,
  actions,
}: HeaderProps): React.JSX.Element {
  const breadcrumb = getRouteBreadcrumb(useMatches())

  return (
    <header className="relative z-10 flex h-14.5 shrink-0 items-center justify-between gap-4 bg-surface px-4 shadow-sm md:pr-6 md:pl-5">
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          aria-label="Menu"
          aria-expanded={isMenuOpen}
          aria-controls={sidebarId}
          onClick={onMenuToggle}
          className="-ml-2 rounded-md p-2 hover:bg-sidebar-active focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none md:hidden"
        >
          <MenuIcon />
        </button>
        {breadcrumb !== undefined && (
          <nav aria-label="Breadcrumb" className="min-w-0">
            <ol className="flex min-w-0 items-center gap-1 text-label-large text-brand">
              {breadcrumb.parents.map((parent) => (
                <li key={parent.to} className="flex shrink-0 items-center gap-1">
                  <Link
                    to={parent.to}
                    className="rounded-sm hover:underline focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
                  >
                    {parent.label}
                  </Link>
                  <span aria-hidden="true">/</span>
                </li>
              ))}
              <li aria-current="page" className="truncate">
                {breadcrumb.title}
              </li>
            </ol>
          </nav>
        )}
      </div>
      <div className="flex items-center gap-3">
        {actions}
        <button
          type="button"
          aria-label="Notifications"
          className="flex size-11 items-center justify-center rounded-lg bg-sidebar-active text-accent hover:opacity-80 focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
        >
          <BellIcon className="size-6" />
        </button>
      </div>
    </header>
  )
}
