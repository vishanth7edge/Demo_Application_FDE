import { Link } from 'react-router'

import type { RecentProduct } from '../application/index.ts'
import { formatCurrency, formatDate, formatNumber } from '../../../shared/format/format.ts'
import { Card } from '../../../shared/ui/Card.tsx'
import { EmptyState } from '../../../shared/ui/EmptyState.tsx'
import { IconBox } from '../../../shared/ui/Icons.tsx'

export interface RecentProductsCardProps {
  products: RecentProduct[]
}

export function RecentProductsCard({ products }: RecentProductsCardProps): React.JSX.Element {
  return (
    <Card
      title="Recently added"
      description="The five newest products in the catalogue."
      flush
      actions={
        <Link to="/products" className="text-sm font-medium text-brand hover:underline">
          View all products →
        </Link>
      }
    >
      {products.length === 0 ? (
        <EmptyState
          icon={<IconBox />}
          title="No products yet"
          description="New products will show up here."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-line text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">
              <tr>
                <th scope="col" className="px-5 py-3">
                  Product
                </th>
                <th scope="col" className="px-3 py-3">
                  Category
                </th>
                <th scope="col" className="px-3 py-3 text-right">
                  Price
                </th>
                <th scope="col" className="px-3 py-3 text-right">
                  Stock
                </th>
                <th scope="col" className="px-5 py-3">
                  Added
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {products.map((product) => (
                <tr key={product.id}>
                  <td className="px-5 py-3">
                    <Link
                      to={`/products/${String(product.id)}`}
                      title={product.name}
                      className="block max-w-[18rem] truncate font-medium text-slate-900 hover:text-brand hover:underline"
                    >
                      {product.name}
                    </Link>
                    <span className="font-mono text-xs text-slate-500">{product.sku}</span>
                  </td>
                  <td className="px-3 py-3 text-slate-600">{product.category}</td>
                  <td className="px-3 py-3 text-right tabular-nums">
                    {formatCurrency(product.price)}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums">
                    {formatNumber(product.quantity)}
                  </td>
                  <td className="px-5 py-3 text-slate-600">{formatDate(product.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}
