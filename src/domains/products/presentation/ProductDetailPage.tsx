import { Link, useNavigate, useParams } from 'react-router'

import type { Product } from '../application/index.ts'
import { flashState } from '../../../shared/feedback/flash.ts'
import { Button } from '../../../shared/ui/Button.tsx'
import { buttonClasses } from '../../../shared/ui/buttonStyles.ts'
import { IconPencil, IconTrash } from '../../../shared/ui/Icons.tsx'
import { PageHeader } from '../../../shared/ui/PageHeader.tsx'
import { DeleteProductDialog } from './DeleteProductDialog.tsx'
import { ProductDetails } from './ProductDetails.tsx'
import { ProductLoader } from './ProductLoader.tsx'
import { useProductDelete } from './useProductDelete.ts'

export type ProductDetailPageProps = Record<string, never>

export function ProductDetailPage(_props: ProductDetailPageProps): React.JSX.Element {
  const { productId } = useParams()
  const navigate = useNavigate()
  const deletion = useProductDelete((product) => {
    void navigate('/products', { state: flashState(`“${product.name}” was deleted.`) })
  })

  const renderActions = (product: Product): React.JSX.Element => (
    <>
      <Link to={`/products/${String(product.id)}/edit`} className={buttonClasses('secondary')}>
        <IconPencil className="size-4" /> Edit
      </Link>
      <Button
        variant="danger"
        icon={<IconTrash className="size-4" />}
        onClick={() => {
          deletion.requestDelete(product)
        }}
      >
        Delete
      </Button>
    </>
  )

  return (
    <ProductLoader productId={productId}>
      {(product) => (
        <>
          <PageHeader
            breadcrumbs={[{ label: 'Products', to: '/products' }, { label: product.name }]}
            title={product.name}
            description={
              <>
                SKU <span className="font-mono">{product.sku}</span> · Product ID #{product.id}
              </>
            }
            actions={renderActions(product)}
          />
          <ProductDetails product={product} />
          <DeleteProductDialog deletion={deletion} />
        </>
      )}
    </ProductLoader>
  )
}
