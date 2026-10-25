import { Link } from 'react-router'

import { IconChevronRight } from './Icons.tsx'

export interface BreadcrumbItem {
  label: string
  /** Omit for the current page. */
  to?: string
}

export interface BreadcrumbsProps {
  items: readonly BreadcrumbItem[]
}

export function Breadcrumbs({ items }: BreadcrumbsProps): React.JSX.Element {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1 text-sm text-slate-500">
        {items.map((item, index) => (
          <li key={`${item.label}-${String(index)}`} className="flex min-w-0 items-center gap-1">
            {index > 0 ? <IconChevronRight className="size-4 shrink-0 text-slate-400" /> : null}
            {item.to === undefined ? (
              <span aria-current="page" className="truncate font-medium text-slate-700">
                {item.label}
              </span>
            ) : (
              <Link to={item.to} className="truncate hover:text-brand hover:underline">
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
