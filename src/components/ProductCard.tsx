import { Link } from 'react-router'

import { formatPrice } from '../helpers/productFormat.ts'
import { ProductCardMenu } from './ProductCardMenu.tsx'
import { ProductImage } from './ProductImage.tsx'

import type { Product } from '../services/productService.ts'

export interface ProductCardProps {
  product: Product
  onDelete: () => void
  // Shown under the price, above the card link (the products page passes AddToCartButton).
  action?: React.ReactNode
}

// Figma "Product List" card: image, ⋮ menu, name, brand/category, price, plus an optional action (Add to cart).
// The whole card opens the detail page: the name's link is stretched over the card with an
// ::after layer. The ⋮ menu and the action sit above that layer (z-index), so clicking them
// only opens the menu or changes the cart.
export function ProductCard({ product, onDelete, action }: ProductCardProps): React.JSX.Element {
  const subtitle = [product.brand, product.category].filter((part) => part !== '').join(' / ')

  return (
    <li className="relative flex flex-col rounded-lg bg-surface shadow-sm transition-shadow focus-within:ring-2 focus-within:ring-brand hover:shadow-md hover:ring-1 hover:ring-brand/40">
      <ProductImage
        key={product.thumbnail}
        src={product.thumbnail}
        alt={product.title}
        className="aspect-[118/117] w-full rounded-t-lg"
      />
      <div className="absolute top-1.5 right-1.5">
        <ProductCardMenu productId={product.id} productTitle={product.title} onDelete={onDelete} />
      </div>
      <div className="flex flex-1 flex-col gap-1 p-2 pb-3">
        <h2 className="line-clamp-2 text-label-large">
          <Link
            to={`/products/${String(product.id)}`}
            className="after:absolute after:inset-0 after:rounded-lg after:content-[''] hover:text-brand focus-visible:outline-none"
          >
            {product.title}
          </Link>
        </h2>
        <p className="truncate text-body-small capitalize">{subtitle}</p>
        <p className="mt-auto pt-2 text-body-medium text-brand">{formatPrice(product.price)}</p>
        {action !== undefined && <div className="relative z-10 mt-2">{action}</div>}
      </div>
    </li>
  )
}
