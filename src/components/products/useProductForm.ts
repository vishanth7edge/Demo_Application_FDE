import { useState } from 'react'

import {
  calculateMargin,
  NO_PRODUCT_ERRORS,
  type ProductFormErrors,
  type ProductFormValues,
  validateProductForm,
} from '../../helpers/productForm.ts'
import {
  clearProductDraft,
  loadProductDraft,
  saveProductDraft,
} from '../../helpers/productDraftStorage.ts'
import { hasErrors } from '../../helpers/validators.ts'
import { addProduct } from '../../services/productService.ts'

export interface ProductForm {
  values: ProductFormValues
  errors: ProductFormErrors
  isSubmitting: boolean
  submitError: string | null
  draftSaved: boolean
  /** True once the product was added successfully. */
  created: boolean
  setField: <K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) => void
  saveDraft: () => void
  submit: () => void
}

export function useProductForm(): ProductForm {
  const [values, setValues] = useState<ProductFormValues>(loadProductDraft)
  const [errors, setErrors] = useState<ProductFormErrors>(NO_PRODUCT_ERRORS)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [draftSaved, setDraftSaved] = useState(false)
  const [created, setCreated] = useState(false)

  const send = async (): Promise<void> => {
    setIsSubmitting(true)
    setSubmitError(null)
    const result = await addProduct({
      title: values.name.trim(),
      description: values.description.trim(),
      category: values.category,
      price: Number(values.ratePerUnit),
      form: values.form,
      safety: values.safety,
      uom: values.uom,
      ecoFriendly: values.ecoFriendly,
      handleWithCare: values.handleWithCare,
      marketSellingPrice: Number(values.marketPrice),
      profitMargin: calculateMargin(values.ratePerUnit, values.marketPrice),
      productType: values.productType.trim(),
      productSize: values.productSize.trim(),
      productVariant: values.productVariant.trim(),
      productColor: values.productColor.trim(),
    })
    setIsSubmitting(false)
    if (result.error) {
      setSubmitError(result.message)
      return
    }
    clearProductDraft()
    setCreated(true)
  }

  return {
    values,
    errors,
    isSubmitting,
    submitError,
    draftSaved,
    created,
    setField: (key, value) => {
      setValues((current) => ({ ...current, [key]: value }))
      setDraftSaved(false)
      if (key in errors) {
        setErrors((current) => ({ ...current, [key]: null }))
      }
    },
    saveDraft: () => {
      saveProductDraft(values)
      setDraftSaved(true)
    },
    submit: () => {
      if (isSubmitting) {
        return
      }
      const nextErrors = validateProductForm(values)
      setErrors(nextErrors)
      if (!hasErrors(nextErrors)) {
        void send()
      }
    },
  }
}
