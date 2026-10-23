import { useEffect } from 'react'
import { NavLink } from 'react-router'

import { useAuth } from '../../context/useAuth.ts'
import {
  DashboardIcon,
  LogoutIcon,
  OrdersIcon,
  ProductsIcon,
  SettingsIcon,
  VendorsIcon,
} from '../icons/NavIcons.tsx'
import { CloseIcon } from '../icons/UiIcons.tsx'
import { Logo } from '../Logo.tsx'
import { UserChip } from './UserChip.tsx'

import type { NavIconProps } from '../icons/NavIcons.tsx'

const MAIN_NAV = [
  { to: '/dashboard', label: 'Dashboard', Icon: DashboardIcon },
  { to: '/products', label: 'Products', Icon: ProductsIcon },
  { to: '/orders', label: 'Orders', Icon: OrdersIcon },
  { to: '/vendors', label: 'Vendors', Icon: VendorsIcon },
] as const

// Figma: 50px rows, 2px brand bar on the left edge, active row tinted with a rounded right side.
const ITEM_CLASSES =
  'relative mr-2.5 flex h-12.5 items-center gap-3.5 rounded-r-lg pl-7 text-label-large focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none'
const ACTIVE_CLASSES =
  'bg-sidebar-active text-brand before:absolute before:top-1/2 before:left-0 before:h-7.5 before:w-0.5 before:-translate-y-1/2 before:rounded-full before:bg-brand'
const INACTIVE_CLASSES = 'hover:bg-sidebar-active/60'

interface SidebarLinkProps {
  to: string
  label: string
  Icon: (props: NavIconProps) => React.JSX.Element
  onNavigate: () => void
}

function SidebarLink({ to, label, Icon, onNavigate }: SidebarLinkProps): React.JSX.Element {
  return (
    <NavLink
      to={to}
      onClick={onNavigate}
      className={({ isActive }) =>
        `${ITEM_CLASSES} ${isActive ? ACTIVE_CLASSES : INACTIVE_CLASSES}`
      }
    >
      {({ isActive }) => (
        <>
          <Icon className={`size-7 shrink-0 ${isActive ? 'text-accent' : ''}`} />
          {label}
        </>
      )}
    </NavLink>
  )
}

export interface SidebarProps {
  id: string
  // Only matters below `md`; from `md` up the sidebar is always shown.
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({ id, isOpen, onClose }: SidebarProps): React.JSX.Element {
  const { logout } = useAuth()

  useEffect(() => {
    if (!isOpen) {
      return
    }
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  return (
    <>
      {isOpen && (
        <div
          aria-hidden="true"
          onClick={onClose}
          className="fixed inset-0 z-30 bg-on-surface/40 md:hidden"
        />
      )}
      {/* Mobile: off-canvas drawer. `invisible` keeps closed links out of the tab order. */}
      <aside
        id={id}
        className={`fixed inset-y-0 left-0 z-40 flex w-72 shrink-0 flex-col overflow-y-auto rounded-br-xl bg-sidebar transition-transform md:visible md:static md:z-auto md:translate-x-0 ${
          isOpen ? 'visible translate-x-0' : 'invisible -translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-9 pt-10 pb-13">
          <Logo />
          <button
            type="button"
            aria-label="Close menu"
            onClick={onClose}
            className="-mr-4 rounded-md p-2 hover:bg-sidebar-active focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none md:hidden"
          >
            <CloseIcon />
          </button>
        </div>
        <hr className="mx-6 border-on-surface-muted/50" />

        <nav aria-label="Main" className="flex flex-1 flex-col gap-5 py-10">
          {MAIN_NAV.map(({ to, label, Icon }) => (
            <SidebarLink key={to} to={to} label={label} Icon={Icon} onNavigate={onClose} />
          ))}
        </nav>

        <hr className="mx-6 border-on-surface-muted/50" />
        <div className="flex flex-col gap-5 pt-10 pb-6">
          <SidebarLink to="/settings" label="Settings" Icon={SettingsIcon} onNavigate={onClose} />
          <button type="button" onClick={logout} className={`${ITEM_CLASSES} ${INACTIVE_CLASSES}`}>
            <LogoutIcon className="size-7 shrink-0" />
            Logout
          </button>
        </div>
        <div className="pb-8">
          <UserChip onNavigate={onClose} />
        </div>
      </aside>
    </>
  )
}
