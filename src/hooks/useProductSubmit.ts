import { useState } from 'react'
import { useNavigate } from 'react-router'

import { buildProductFormData } from '../services/productService.ts'

import type { FlashState } from '../helpers/flashMessage.ts'
import type { ProductValues } from '../helpers/validators.ts'
import type { SavedProduct } from '../services/productService.ts'
import type { ApiResult } from '../shared/httpClient.ts'

export interface ProductSubmit {
  isSubmitting: boolean
  submitError: string | null
  submit: (values: ProductValues, images: Blob[]) => void
}

// Shared by the add and edit pages: send the form as FormData, then go back to /products
// with a success message. On failure the form stays mounted, so what was typed is kept.
export function useProductSubmit(
  save: (data: FormData) => Promise<ApiResult<SavedProduct>>,
  success: (id: number) => FlashState,
): ProductSubmit {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const run = async (values: ProductValues, images: Blob[]): Promise<void> => {
    setIsSubmitting(true)
    setSubmitError(null)
    const result = await save(buildProductFormData(values, images))
    if (result.error) {
      setSubmitError(result.message)
      setIsSubmitting(false)
      return
    }
    void navigate('/products', { state: success(result.data.id) })
  }

  return {
    isSubmitting,
    submitError,
    submit: (values, images) => {
      void run(values, images)
    },
  }
}
