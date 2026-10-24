import { ChevronLeftIcon, ChevronRightIcon } from './Icons.tsx'

export interface PaginationProps {
  /** Zero-based page index. */
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
}

const ARROW_CLASSES =
  'rounded-md p-1 text-on-surface hover:bg-surface-container-high focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none disabled:text-outline-variant disabled:hover:bg-transparent'

export default function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
}: PaginationProps): React.JSX.Element {
  const first = total === 0 ? 0 : page * pageSize + 1
  const last = Math.min((page + 1) * pageSize, total)

  return (
    <nav aria-label="Pagination" className="flex items-center justify-end gap-3">
      <p className="text-label-small text-on-surface-variant">
        {first}-{last} of {total}
      </p>
      <button
        type="button"
        aria-label="Previous page"
        disabled={page === 0}
        onClick={() => {
          onPageChange(page - 1)
        }}
        className={ARROW_CLASSES}
      >
        <ChevronLeftIcon />
      </button>
      <button
        type="button"
        aria-label="Next page"
        disabled={last >= total}
        onClick={() => {
          onPageChange(page + 1)
        }}
        className={ARROW_CLASSES}
      >
        <ChevronRightIcon />
      </button>
    </nav>
  )
}
