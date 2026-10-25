import type { ReactNode } from 'react'

import type { Product, ProductListQuery, ProductSortField } from '../application/index.ts'
import { RetryAlert } from '../../../shared/ui/RetryAlert.tsx'
import { Spinner } from '../../../shared/ui/Spinner.tsx'
import { ProductTableRow } from './ProductTableRow.tsx'
import { SortableHeader } from './SortableHeader.tsx'

export interface ProductTableProps {
  items: Product[] | null
  query: ProductListQuery
  loading: boolean
  error: string | null
  canManage: boolean
  emptyState: ReactNode
  onSort: (field: ProductSortField) => void
  onDelete: (product: Product) => void
  onRetry: () => void
}

const COLUMNS: readonly { field: ProductSortField; label: string; align?: 'right' }[] = [
  { field: 'name', label: 'Product' },
  { field: 'category', label: 'Category' },
  { field: 'price', label: 'Price', align: 'right' },
  { field: 'quantity', label: 'Stock' },
  { field: 'status', label: 'Status' },
  { field: 'createdAt', label: 'Created' },
]

export function ProductTable({
  items,
  query,
  loading,
  error,
  canManage,
  emptyState,
  onSort,
  onDelete,
  onRetry,
}: ProductTableProps): React.JSX.Element {
  const columnCount = COLUMNS.length + (canManage ? 1 : 0)

  let body: ReactNode
  if (error !== null) {
    body = (
      <tr>
        <td colSpan={columnCount} className="p-4 sm:p-5">
          <RetryAlert title="We couldn't load products." message={error} onRetry={onRetry} />
        </td>
      </tr>
    )
  } else if (items === null) {
    body = (
      <tr>
        <td colSpan={columnCount} className="py-16 text-center text-slate-500">
          <span className="inline-flex items-center gap-2 text-sm">
            <Spinner label={null} className="size-5 text-brand" /> Loading products…
          </span>
        </td>
      </tr>
    )
  } else if (items.length === 0) {
    body = (
      <tr>
        <td colSpan={columnCount}>{emptyState}</td>
      </tr>
    )
  } else {
    body = items.map((product) => (
      <ProductTableRow
        key={product.id}
        product={product}
        canManage={canManage}
        onDelete={onDelete}
      />
    ))
  }

  return (
    <div className="overflow-hidden">
      <table
        aria-busy={loading}
        className="min-w-full divide-y divide-line text-sm whitespace-nowrap"
      >
        <thead className="bg-slate-50">
          <tr>
            {COLUMNS.map((column, index) => (
              <SortableHeader
                key={column.field}
                field={column.field}
                label={column.label}
                query={query}
                onSort={onSort}
                {...(column.align === undefined ? {} : { align: column.align })}
                {...(index === 0 ? { first: true } : {})}
              />
            ))}
            {canManage ? (
              <th
                scope="col"
                className="px-3 py-3 pr-4 text-right text-xs font-semibold tracking-wide text-slate-500 uppercase sm:pr-5"
              >
                Actions
              </th>
            ) : null}
          </tr>
        </thead>
        <tbody
          className={`divide-y divide-line bg-surface transition-opacity ${loading && items !== null ? 'opacity-60' : ''}`}
        >
          {body}
        </tbody>
      </table>
    </div>
  )
}
