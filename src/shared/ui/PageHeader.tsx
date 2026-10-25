import type { ReactNode } from 'react'

import { Breadcrumbs } from './Breadcrumbs.tsx'
import type { BreadcrumbItem } from './Breadcrumbs.tsx'

export interface PageHeaderProps {
  title: string
  description?: ReactNode
  breadcrumbs?: readonly BreadcrumbItem[]
  actions?: ReactNode
}

export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
}: PageHeaderProps): React.JSX.Element {
  return (
    <header className="mb-6 space-y-3">
      {breadcrumbs === undefined ? null : <Breadcrumbs items={breadcrumbs} />}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight break-words text-slate-900">
            {title}
          </h1>
          {description === undefined ? null : (
            <div className="mt-1 text-sm text-slate-500">{description}</div>
          )}
        </div>
        {actions === undefined ? null : (
          <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>
        )}
      </div>
    </header>
  )
}
