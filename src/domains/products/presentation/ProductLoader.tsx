import type { ReactNode } from 'react'
import { Link } from 'react-router'

import type { Product } from '../application/index.ts'
import { buttonClasses } from '../../../shared/ui/buttonStyles.ts'
import { EmptyState } from '../../../shared/ui/EmptyState.tsx'
import { IconBox } from '../../../shared/ui/Icons.tsx'
import { RetryAlert } from '../../../shared/ui/RetryAlert.tsx'
import { FullPageSpinner } from '../../../shared/ui/Spinner.tsx'
import { useProduct } from './useProduct.ts'

export interface ProductLoaderProps {
  productId: string | undefined
  children: (product: Product) => ReactNode
}

/** Loads one product by route id and renders loading / not-found / error states around it. */
export function ProductLoader({ productId, children }: ProductLoaderProps): React.JSX.Element {
  const { state, reload } = useProduct(Number(productId))

  switch (state.status) {
    case 'loading':
      return <FullPageSpinner label="Loading product" />
    case 'not-found':
      return (
        <div className="rounded-xl border border-line bg-surface shadow-xs">
          <EmptyState
            icon={<IconBox />}
            title="Product not found"
            description="It may have been deleted, or the link is incorrect."
            action={
              <Link to="/products" className={buttonClasses('secondary')}>
                Back to products
              </Link>
            }
          />
        </div>
      )
    case 'error':
      return (
        <RetryAlert
          title="We couldn't load this product."
          message={state.message}
          onRetry={reload}
        />
      )
    case 'ready':
      return <>{children(state.product)}</>
  }
}
