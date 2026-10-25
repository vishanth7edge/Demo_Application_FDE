import type { ReactNode } from 'react'

import { IconLogo } from '../ui/Icons.tsx'

export interface AuthShellProps {
  title: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
}

/** Centered card frame for sign-in and password pages. */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: AuthShellProps): React.JSX.Element {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-canvas px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="mb-4 flex size-12 items-center justify-center rounded-xl bg-brand text-brand-foreground shadow-sm">
            <IconLogo className="size-7" />
          </span>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
          {subtitle === undefined ? null : (
            <p className="mt-1.5 text-sm text-slate-500">{subtitle}</p>
          )}
        </div>
        <div className="rounded-xl border border-line bg-surface p-6 shadow-sm sm:p-8">
          {children}
        </div>
        {footer === undefined ? null : (
          <div className="mt-6 text-center text-sm text-slate-500">{footer}</div>
        )}
      </div>
    </main>
  )
}
