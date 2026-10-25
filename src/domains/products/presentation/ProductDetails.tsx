import type { ReactNode } from 'react'

import { getInventoryValue } from '../application/index.ts'
import type { Product } from '../application/index.ts'
import { formatCurrency, formatDateTime, formatNumber } from '../../../shared/format/format.ts'
import { Card } from '../../../shared/ui/Card.tsx'
import { StatusBadge, StockBadge } from './StatusBadge.tsx'

export interface ProductDetailsProps {
  product: Product
}

function Detail({ label, children }: { label: string; children: ReactNode }): React.JSX.Element {
  return (
    <div>
      <dt className="text-xs font-medium tracking-wide text-slate-500 uppercase">{label}</dt>
      <dd className="mt-1 text-sm text-slate-900">{children}</dd>
    </div>
  )
}

export function ProductDetails({ product }: ProductDetailsProps): React.JSX.Element {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Card title="Product details">
          <dl className="grid gap-6 sm:grid-cols-2">
            <Detail label="Product name">
              <span className="break-words">{product.name}</span>
            </Detail>
            <Detail label="SKU">
              <span className="font-mono">{product.sku}</span>
            </Detail>
            <Detail label="Category">{product.category}</Detail>
            <Detail label="Status">
              <StatusBadge status={product.status} />
            </Detail>
            <Detail label="Price">
              <span className="tabular-nums">{formatCurrency(product.price)}</span>
            </Detail>
            <Detail label="Quantity in stock">
              <span className="flex items-center gap-2">
                <span className="tabular-nums">{formatNumber(product.quantity)}</span>
                <StockBadge quantity={product.quantity} />
              </span>
            </Detail>
          </dl>
        </Card>
      </div>
      <Card title="Summary">
        <dl className="space-y-5">
          <Detail label="Inventory value">
            <span className="text-lg font-semibold tabular-nums">
              {formatCurrency(getInventoryValue(product))}
            </span>
          </Detail>
          <Detail label="Product ID">#{product.id}</Detail>
          <Detail label="Created">{formatDateTime(product.createdAt)}</Detail>
          <Detail label="Last updated">{formatDateTime(product.updatedAt)}</Detail>
        </dl>
      </Card>
    </div>
  )
}
