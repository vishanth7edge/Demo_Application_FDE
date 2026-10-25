import { useId } from 'react'

import { Button } from './Button.tsx'
import { controlClasses } from './fieldStyles.ts'
import { IconChevronLeft, IconChevronRight } from './Icons.tsx'

export interface PaginationProps {
  page: number
  pageSize: number
  total: number
  pageSizeOptions: readonly number[]
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  itemLabel?: string
}

export function Pagination({
  page,
  pageSize,
  total,
  pageSizeOptions,
  onPageChange,
  onPageSizeChange,
  itemLabel = 'items',
}: PaginationProps): React.JSX.Element {
  const sizeId = useId()
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, total)

  return (
    <div className="flex flex-col gap-3 border-t border-line px-4 py-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <p aria-live="polite">
        Showing <span className="font-medium text-slate-900">{start}</span>–
        <span className="font-medium text-slate-900">{end}</span> of{' '}
        <span className="font-medium text-slate-900">{total}</span> {itemLabel}
      </p>
      <div className="flex flex-wrap items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-2">
          <label htmlFor={sizeId} className="whitespace-nowrap">
            Rows per page
          </label>
          <select
            id={sizeId}
            value={pageSize}
            onChange={(event) => {
              onPageSizeChange(Number(event.target.value))
            }}
            className={`${controlClasses(false)} h-8 w-20 pr-7`}
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            aria-label="Previous page"
            disabled={page <= 1}
            onClick={() => {
              onPageChange(page - 1)
            }}
            icon={<IconChevronLeft className="size-4" />}
          />
          <span className="whitespace-nowrap">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            aria-label="Next page"
            disabled={page >= totalPages}
            onClick={() => {
              onPageChange(page + 1)
            }}
            icon={<IconChevronRight className="size-4" />}
          />
        </div>
      </div>
    </div>
  )
}
