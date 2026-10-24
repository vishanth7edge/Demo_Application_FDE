import { useState } from 'react'
import { Link } from 'react-router'

import { ImageIcon, KebabIcon } from '../Icons.tsx'
import type { Product } from '../../services/productService.ts'

export interface ProductCardProps {
  product: Product
  onDelete: (product: Product) => void
}

export default function ProductCard({ product, onDelete }: ProductCardProps): React.JSX.Element {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <li className="relative flex flex-col overflow-hidden rounded-lg bg-surface shadow-sm">
      <div className="flex aspect-square items-center justify-center bg-surface-container text-outline">
        {product.thumbnail === '' ? (
          <div className="flex flex-col items-center gap-1 text-label-small uppercase">
            <ImageIcon size={48} />
            Product image not available
          </div>
        ) : (
          <img src={product.thumbnail} alt="" className="size-full object-cover" />
        )}
      </div>
      <button
        type="button"
        aria-label={`Actions for ${product.title}`}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        onClick={() => {
          setMenuOpen((open) => !open)
        }}
        className="absolute top-2 right-2 rounded-full bg-surface p-1 text-secondary focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
      >
        <KebabIcon />
      </button>
      {menuOpen && (
        <ul
          role="menu"
          className="absolute top-10 right-2 z-10 min-w-28 rounded-lg bg-surface py-1 shadow-lg"
        >
          <li role="none">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setMenuOpen(false)
                onDelete(product)
              }}
              className="w-full px-4 py-2 text-left text-label-large text-error hover:bg-error-container"
            >
              Delete
            </button>
          </li>
        </ul>
      )}
      <div className="flex flex-col gap-1 p-3">
        <Link
          to={`/products/${String(product.id)}`}
          className="truncate text-title-medium text-on-surface hover:underline"
        >
          {product.title}
        </Link>
        <p className="truncate text-body-small text-on-surface-variant">
          {product.brand === '' ? product.category : `${product.brand}/${product.category}`}
        </p>
        <p className="mt-3 text-title-medium text-primary">${product.price}</p>
      </div>
    </li>
  )
}
