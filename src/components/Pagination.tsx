import { pageRangeLabel } from '../helpers/productFormat.ts'
import { ChevronLeftIcon, ChevronNextIcon } from './icons/ProductIcons.tsx'

export interface PaginationProps {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
}

const ARROW =
  'flex size-8 items-center justify-center rounded-full text-on-surface hover:bg-sidebar-active focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none disabled:text-outline disabled:hover:bg-transparent'

// "1–10 of 150  ‹ ›" at the bottom right of the product list.
export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
}: PaginationProps): React.JSX.Element {
  const lastPage = Math.max(1, Math.ceil(total / pageSize))

  return (
    <nav aria-label="Pagination" className="flex items-center justify-end gap-2">
      <p aria-live="polite" className="mr-2 text-body-small">
        {pageRangeLabel(page, pageSize, total)}
      </p>
      <button
        type="button"
        aria-label="Previous page"
        disabled={page <= 1}
        onClick={() => {
          onPageChange(page - 1)
        }}
        className={ARROW}
      >
        <ChevronLeftIcon className="size-4" />
      </button>
      <button
        type="button"
        aria-label="Next page"
        disabled={page >= lastPage}
        onClick={() => {
          onPageChange(page + 1)
        }}
        className={ARROW}
      >
        <ChevronNextIcon className="size-4" />
      </button>
    </nav>
  )
}
