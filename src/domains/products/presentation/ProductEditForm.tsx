import { useState } from 'react'
import { useNavigate } from 'react-router'

import { toFormValues, updateProduct } from '../application/index.ts'
import type { Product } from '../application/index.ts'
import { flashState } from '../../../shared/feedback/flash.ts'
import { useToast } from '../../../shared/feedback/useToast.ts'
import { PageHeader } from '../../../shared/ui/PageHeader.tsx'
import { ProductForm } from './ProductForm.tsx'
import { useProductForm } from './useProductForm.ts'

export interface ProductEditFormProps {
  product: Product
}

export function ProductEditForm({ product }: ProductEditFormProps): React.JSX.Element {
  const form = useProductForm(toFormValues(product))
  const navigate = useNavigate()
  const { notify } = useToast()
  const [submitting, setSubmitting] = useState(false)
  const detailPath = `/products/${String(product.id)}`

  const submit = async (): Promise<void> => {
    const input = form.validate()
    if (input === null) {
      return
    }
    setSubmitting(true)
    const result = await updateProduct(product.id, input)
    setSubmitting(false)
    if (result.error) {
      form.applyServerErrors(result.details)
      notify(`Couldn't save your changes. ${result.message}`, 'error')
      return
    }
    void navigate(detailPath, { state: flashState(`“${result.data.name}” was updated.`) })
  }

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: 'Products', to: '/' },
          { label: product.name, to: detailPath },
          { label: 'Edit' },
        ]}
        title="Edit product"
        description={
          <>
            Editing <span className="font-medium text-slate-700">{product.sku}</span> · Product ID #
            {product.id}
          </>
        }
      />
      <ProductForm
        form={form}
        submitting={submitting}
        submitLabel="Save changes"
        onSubmit={() => {
          if (!submitting) {
            void submit()
          }
        }}
        onCancel={() => {
          void navigate(detailPath)
        }}
      />
    </>
  )
}
