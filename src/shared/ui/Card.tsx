import type { ReactNode } from 'react'

export interface CardProps {
  title?: string
  description?: string
  actions?: ReactNode
  /** Removes body padding, e.g. for edge-to-edge tables. */
  flush?: boolean
  children: ReactNode
}

export function Card({
  title,
  description,
  actions,
  flush = false,
  children,
}: CardProps): React.JSX.Element {
  return (
    <section className="rounded-xl border border-line bg-surface shadow-xs">
      {title === undefined ? null : (
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">{title}</h2>
            {description === undefined ? null : (
              <p className="mt-0.5 text-sm text-slate-500">{description}</p>
            )}
          </div>
          {actions}
        </header>
      )}
      <div className={flush ? '' : 'p-5 sm:p-6'}>{children}</div>
    </section>
  )
}
