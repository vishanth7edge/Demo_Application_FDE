import { useRef, useState } from 'react'

import { useDismiss } from '../hooks/useDismiss.ts'
import { useProductCategories } from '../hooks/useProductCategories.ts'
import { Button } from './Button.tsx'
import { FilterIcon } from './icons/ProductIcons.tsx'
import { LoadingRegion } from './LoadingRegion.tsx'
import { Select } from './Select.tsx'
import { Skeleton } from './Skeleton.tsx'

export interface CategoryFilterProps {
  // The category the list is filtered by ('' = all).
  applied: string
  onApply: (category: string) => void
}

function categoryLabel(slug: string): string {
  return slug.replace(/-/g, ' ').replace(/^\w/, (letter) => letter.toUpperCase())
}

// The filter button next to search. The choice is staged ("pending") and only reaches the list on
// Apply; closing without Apply discards it (see .claude/rules/state-and-data.md).
export function CategoryFilter({ applied, onApply }: CategoryFilterProps): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(applied)
  const rootRef = useRef<HTMLDivElement>(null)
  const load = useProductCategories(open)

  const close = (): void => {
    setPending(applied)
    setOpen(false)
  }
  useDismiss(rootRef, open, close)

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label={applied === '' ? 'Filter' : 'Filter (1 applied)'}
        aria-expanded={open}
        onClick={() => {
          if (open) {
            close()
          } else {
            setPending(applied)
            setOpen(true)
          }
        }}
        className="relative flex size-10 items-center justify-center rounded-lg bg-sidebar-active text-accent hover:bg-sidebar focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
      >
        <FilterIcon className="size-6" />
        {applied !== '' && (
          <span
            aria-hidden="true"
            className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-brand text-label-small text-brand-foreground"
          >
            1
          </span>
        )}
      </button>
      {open && (
        <div
          role="group"
          aria-label="Filter products"
          className="absolute right-0 z-20 mt-2 flex w-72 flex-col gap-4 rounded-xl border border-outline bg-surface p-4 shadow-lg"
        >
          {load.status === 'ready' ? (
            <Select
              label="Category"
              placeholder="All categories"
              value={pending}
              onChange={setPending}
              options={load.categories.map((slug) => ({ value: slug, label: categoryLabel(slug) }))}
            />
          ) : load.status === 'error' ? (
            <p role="alert" className="text-body-medium text-error">
              {load.message}
            </p>
          ) : (
            <LoadingRegion label="Loading categories…" className="flex flex-col gap-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-11 w-full rounded-lg" />
            </LoadingRegion>
          )}
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setPending('')
                setOpen(false)
                onApply('')
              }}
            >
              Clear
            </Button>
            <Button
              onClick={() => {
                setOpen(false)
                onApply(pending)
              }}
            >
              Apply
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
