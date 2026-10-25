import { Link } from 'react-router'

import type { Product } from '../application/index.ts'
import { formatCurrency, formatDate, formatNumber } from '../../../shared/format/format.ts'
import { IconPencil, IconTrash } from '../../../shared/ui/Icons.tsx'
import { StatusBadge, StockBadge } from './StatusBadge.tsx'

export interface ProductTableRowProps {
  product: Product
  canManage: boolean
  onDelete: (product: Product) => void
}

const ICON_BUTTON =
  'inline-flex size-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none'

export function ProductTableRow({
  product,
  canManage,
  onDelete,
}: ProductTableRowProps): React.JSX.Element {
  return (
    <tr className="hover:bg-slate-50/70">
      <td className="px-3 py-3 pl-4 sm:pl-5">
        <Link
          to={`/products/${String(product.id)}`}
          title={product.name}
          className="block max-w-[16rem] truncate font-medium text-slate-900 hover:text-brand hover:underline"
        >
          {product.name}
        </Link>
        <p className="mt-0.5 text-xs text-slate-500">
          <span className="font-mono">{product.sku}</span> · #{product.id}
        </p>
      </td>
      <td className="px-3 py-3 text-slate-600">{product.category}</td>
      <td className="px-3 py-3 text-right text-slate-900 tabular-nums">
        {formatCurrency(product.price)}
      </td>
      <td className="px-3 py-3">
        <div className="flex items-center gap-2">
          <span className="text-slate-900 tabular-nums">{formatNumber(product.quantity)}</span>
          <StockBadge quantity={product.quantity} />
        </div>
      </td>
      <td className="px-3 py-3">
        <StatusBadge status={product.status} />
      </td>
      <td className="px-3 py-3 text-slate-600">{formatDate(product.createdAt)}</td>
      {canManage ? (
        <td className="px-3 py-3 pr-4 text-right sm:pr-5">
          <div className="flex justify-end gap-1">
            <Link
              to={`/products/${String(product.id)}/edit`}
              aria-label={`Edit ${product.name}`}
              title="Edit"
              className={`${ICON_BUTTON} hover:text-brand`}
            >
              <IconPencil className="size-4" />
            </Link>
            <button
              type="button"
              onClick={() => {
                onDelete(product)
              }}
              className={`${ICON_BUTTON} hover:text-rose-600`}
            >
              <IconTrash className="size-4" />
            </button>
          </div>
        </td>
      ) : null}
    </tr>
  )
}
