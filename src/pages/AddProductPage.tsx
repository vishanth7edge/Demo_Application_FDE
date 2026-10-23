import { ProductForm } from '../components/ProductForm.tsx'
import { flashState } from '../helpers/flashMessage.ts'
import { useProductSubmit } from '../hooks/useProductSubmit.ts'
import { addProduct } from '../services/productService.ts'

export type AddProductPageProps = Record<string, never>

export function AddProductPage(): React.JSX.Element {
  const { isSubmitting, submitError, submit } = useProductSubmit(addProduct, (id) =>
    flashState(
      'Product Added Successfully',
      `The product was saved with id ${String(id)}. DummyJSON does not store new products, so it will not appear in the list.`,
    ),
  )

  return (
    <section>
      <h1 className="sr-only">Add product</h1>
      <ProductForm
        mode="add"
        isSubmitting={isSubmitting}
        submitError={submitError}
        onSubmit={submit}
      />
    </section>
  )
}
