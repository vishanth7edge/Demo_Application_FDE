import { useParams } from 'react-router'

import { ProductEditForm } from './ProductEditForm.tsx'
import { ProductLoader } from './ProductLoader.tsx'

export type ProductEditPageProps = Record<string, never>

export function ProductEditPage(_props: ProductEditPageProps): React.JSX.Element {
  const { productId } = useParams()
  return (
    <ProductLoader productId={productId}>
      {(product) => <ProductEditForm key={product.id} product={product} />}
    </ProductLoader>
  )
}
