import { NavLink } from 'react-router'
import type { ReactNode } from 'react'

import { IconLogo, IconLogout } from '../ui/Icons.tsx'

export interface NavItem {
  to: string
  label: string
  icon: ReactNode
}

export interface ShellUser {
  name: string
  detail: string
}

export interface SidebarContentProps {
  navigation: readonly NavItem[]
  user: ShellUser
  onLogout: () => void
  onNavigate?: () => void
}

function initials(name: string): string {
  return name
    .split(' ')
    .map((part) => part.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export function SidebarContent({
  navigation,
  user,
  onLogout,
  onNavigate,
}: SidebarContentProps): React.JSX.Element {
  return (
    <div className="flex h-full flex-col bg-sidebar">
      <div className="flex h-16 shrink-0 items-center gap-2.5 px-5">
        <span className="flex size-8 items-center justify-center rounded-lg bg-brand text-brand-foreground">
          <IconLogo className="size-5" />
        </span>
        <span className="text-base font-semibold text-white">Buggy Store</span>
      </div>

      <nav aria-label="Main" className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none ${
                isActive
                  ? 'bg-sidebar-hover text-sidebar-active'
                  : 'text-sidebar-text hover:bg-sidebar-hover hover:text-white'
              }`
            }
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-3 px-2 py-2">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-white">
            {initials(user.name)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">{user.name}</p>
            <p className="truncate text-xs text-sidebar-text">{user.detail}</p>
          </div>
        </div>
        <div
          role="button"
          onClick={onLogout}
          className="mt-1 flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-text transition-colors hover:bg-sidebar-hover hover:text-white"
        >
          <IconLogout />
          Logout
        </div>
      </div>
    </div>
  )
}
