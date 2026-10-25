import { useState } from 'react'
import { useNavigate } from 'react-router'

import { createProduct, EMPTY_PRODUCT_FORM } from '../application/index.ts'
import { flashState } from '../../../shared/feedback/flash.ts'
import { useToast } from '../../../shared/feedback/useToast.ts'
import { PageHeader } from '../../../shared/ui/PageHeader.tsx'
import { ProductForm } from './ProductForm.tsx'
import { useProductForm } from './useProductForm.ts'

export type ProductCreatePageProps = Record<string, never>

export function ProductCreatePage(_props: ProductCreatePageProps): React.JSX.Element {
  const form = useProductForm(EMPTY_PRODUCT_FORM)
  const navigate = useNavigate()
  const { notify } = useToast()
  const [submitting, setSubmitting] = useState(false)

  const submit = async (): Promise<void> => {
    const input = form.validate()
    if (input === null) {
      return
    }
    const result = await createProduct(input)
    setSubmitting(false)
    if (result.error) {
      form.applyServerErrors(result.details)
      notify(`Couldn't create the product. ${result.message}`, 'error')
      return
    }
    void navigate('/products', { state: flashState(`“${result.data.name}” was created.`) })
  }

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: 'Products', to: '/products' }, { label: 'Add product' }]}
        title="Add product"
        description="New products appear at the top of the product list."
      />
      <ProductForm
        form={form}
        submitting={submitting}
        submitLabel="Create product"
        onSubmit={() => {
          if (!submitting) {
            void submit()
          }
        }}
        onCancel={() => {
          void navigate('/products')
        }}
      />
    </>
  )
}
