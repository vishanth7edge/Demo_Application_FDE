import { useParams } from 'react-router'

import { ProductForm } from '../components/ProductForm.tsx'
import { ProductLoadState } from '../components/ProductLoadState.tsx'
import { ProductFormSkeleton } from '../components/ProductSkeletons.tsx'
import { flashState, parseProductId } from '../helpers/flashMessage.ts'
import { useProduct } from '../hooks/useProduct.ts'
import { useProductSubmit } from '../hooks/useProductSubmit.ts'
import { productToFormValues, updateProduct } from '../services/productService.ts'

export type EditProductPageProps = Record<string, never>

interface EditProductFormProps {
  productId: number
}

function EditProductForm({ productId }: EditProductFormProps): React.JSX.Element {
  const load = useProduct(productId)
  const { isSubmitting, submitError, submit } = useProductSubmit(
    (data) => updateProduct(productId, data),
    (id) =>
      flashState(
        'Product Updated Successfully',
        `Product ${String(id)} was saved. DummyJSON does not store changes, so the list still shows the old values.`,
      ),
  )

  return (
    <ProductLoadState load={load} skeleton={<ProductFormSkeleton />}>
      {(product) => (
        <ProductForm
          mode="edit"
          initialValues={productToFormValues(product)}
          currentImageUrl={product.thumbnail === '' ? undefined : product.thumbnail}
          isSubmitting={isSubmitting}
          submitError={submitError}
          onSubmit={submit}
        />
      )}
    </ProductLoadState>
  )
}

export function EditProductPage(): React.JSX.Element {
  const productId = parseProductId(useParams()['id'])

  return (
    <section>
      <h1 className="sr-only">Edit product</h1>
      {/* key: a different id remounts, so loading and form state start fresh. */}
      {productId === null ? (
        <ProductLoadState load={null} skeleton={null}>
          {() => null}
        </ProductLoadState>
      ) : (
        <EditProductForm key={productId} productId={productId} />
      )}
    </section>
  )
}
