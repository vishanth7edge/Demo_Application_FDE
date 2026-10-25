import type { ProductListQuery, ProductSortField } from '../application/index.ts'
import { IconSort } from '../../../shared/ui/Icons.tsx'

export interface SortableHeaderProps {
  field: ProductSortField
  label: string
  query: Pick<ProductListQuery, 'sort' | 'order'>
  onSort: (field: ProductSortField) => void
  align?: 'left' | 'right'
  /** First column: extra left padding to line up with the card edge. */
  first?: boolean
}

export function SortableHeader({
  field,
  label,
  query,
  onSort,
  align = 'left',
  first = false,
}: SortableHeaderProps): React.JSX.Element {
  const active = query.sort === field
  const direction = active ? query.order : null
  const ariaSort = direction === null ? 'none' : direction === 'asc' ? 'ascending' : 'descending'

  return (
    <th
      scope="col"
      aria-sort={ariaSort}
      className={`px-3 py-3 ${first ? 'pl-4 sm:pl-5' : ''} ${align === 'right' ? 'text-right' : 'text-left'}`}
    >
      <button
        type="button"
        onClick={() => {
          onSort(field)
        }}
        className={`inline-flex items-center gap-1 rounded text-xs font-semibold tracking-wide uppercase focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none ${
          active ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700'
        }`}
      >
        {label}
        <IconSort
          direction={direction}
          className={`size-3.5 ${active ? 'text-brand' : 'text-slate-400'}`}
        />
      </button>
    </th>
  )
}
