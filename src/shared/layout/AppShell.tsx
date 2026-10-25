import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent, ReactNode } from 'react'

import { IconLogo, IconMenu, IconX } from '../ui/Icons.tsx'
import { SidebarContent } from './SidebarContent.tsx'
import type { NavItem, ShellUser } from './SidebarContent.tsx'

export interface AppShellProps {
  navigation: readonly NavItem[]
  user: ShellUser
  onLogout: () => void
  children: ReactNode
}

/** Authenticated page frame: fixed sidebar on desktop, top bar + drawer below `lg`. */
export function AppShell({
  navigation,
  user,
  onLogout,
  children,
}: AppShellProps): React.JSX.Element {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (menuOpen) {
      closeButtonRef.current?.focus()
    }
  }, [menuOpen])

  const closeMenu = (): void => {
    setMenuOpen(false)
    menuButtonRef.current?.focus()
  }

  const handleDrawerKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.key === 'Escape') {
      closeMenu()
    }
  }

  return (
    <div className="min-h-screen bg-canvas">
      <a
        href="#main-content"
        className="sr-only z-[70] rounded-md bg-surface px-3 py-2 text-sm font-medium text-brand shadow focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to main content
      </a>

      <aside className="fixed inset-y-0 left-0 hidden w-60 lg:block">
        <SidebarContent navigation={navigation} user={user} onLogout={onLogout} />
      </aside>

      <div className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-surface px-4 lg:hidden">
        <button
          ref={menuButtonRef}
          type="button"
          aria-label="Open navigation menu"
          aria-expanded={menuOpen}
          onClick={() => {
            setMenuOpen(true)
          }}
          className="-ml-1 rounded-md p-1.5 text-slate-600 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
        >
          <IconMenu />
        </button>
        <span className="flex size-7 items-center justify-center rounded-md bg-brand text-brand-foreground">
          <IconLogo className="size-4" />
        </span>
        <span className="font-semibold text-slate-900">Buggy Store</span>
      </div>

      {menuOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden" onKeyDown={handleDrawerKeyDown}>
          <div className="fixed inset-0 bg-slate-900/50" aria-hidden="true" onClick={closeMenu} />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            className="fixed inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col shadow-xl"
          >
            <button
              ref={closeButtonRef}
              type="button"
              aria-label="Close navigation menu"
              onClick={closeMenu}
              className="absolute top-4 right-3 z-10 rounded-md p-1.5 text-sidebar-text hover:bg-sidebar-hover hover:text-white focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
            >
              <IconX />
            </button>
            <SidebarContent
              navigation={navigation}
              user={user}
              onLogout={onLogout}
              onNavigate={closeMenu}
            />
          </div>
        </div>
      ) : null}

      <main id="main-content" tabIndex={-1} className="focus:outline-none lg:pl-60">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</div>
      </main>
    </div>
  )
}
