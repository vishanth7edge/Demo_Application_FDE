import { Link } from 'react-router'

import { EmptyState } from './EmptyState.tsx'
import { buttonClasses } from './fieldStyles.ts'

import type { ProductLoad } from '../hooks/useProduct.ts'
import type { Product } from '../services/productService.ts'

export interface ProductLoadStateProps {
  // null: the id in the URL is not valid, which is shown as "not found".
  load: ProductLoad | null
  // Shimmer placeholder shaped like the page, shown while loading.
  skeleton: React.ReactNode
  // Rendered once the product has loaded.
  children: (product: Product) => React.ReactNode
}

// Loading / not found / error for pages that show one product (detail and edit).
export function ProductLoadState({
  load,
  skeleton,
  children,
}: ProductLoadStateProps): React.JSX.Element {
  if (load === null || load.status === 'not-found') {
    return (
      <EmptyState
        title="Product not found"
        description="It may have been removed, or the link is wrong."
        action={
          <Link to="/products" className={`${buttonClasses('primary')} w-full`}>
            Back to products
          </Link>
        }
      />
    )
  }
  switch (load.status) {
    case 'loading':
      return <>{skeleton}</>
    case 'error':
      return (
        <p role="alert" className="text-body-medium text-error">
          {load.message}
        </p>
      )
    case 'ready':
      return <>{children(load.product)}</>
  }
}
