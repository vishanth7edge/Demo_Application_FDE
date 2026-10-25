import { useState } from 'react'

import {
  hasFieldErrors,
  toFieldErrors,
  toProductInput,
  validateProductForm,
} from '../application/index.ts'
import type { ProductFieldErrors, ProductFormValues } from '../application/index.ts'
import type { FieldError } from '../../../shared/api/apiClient.ts'

export interface ProductForm {
  values: ProductFormValues
  errors: ProductFieldErrors
  setField: (field: keyof ProductFormValues, value: string) => void
  /** Validates every field; returns the API input when valid, otherwise shows errors and returns null. */
  validate: () => ReturnType<typeof toProductInput> | null
  applyServerErrors: (details: FieldError[]) => void
}

export function useProductForm(initialValues: ProductFormValues): ProductForm {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState<ProductFieldErrors>({})

  return {
    values,
    errors,
    setField: (field, value) => {
      setValues((current) => ({ ...current, [field]: value }))
      setErrors((current) => {
        const { [field]: _removed, ...rest } = current
        return rest
      })
    },
    validate: () => {
      const fieldErrors = validateProductForm(values)
      setErrors(fieldErrors)
      return hasFieldErrors(fieldErrors) ? null : toProductInput(values)
    },
    applyServerErrors: (details) => {
      setErrors(toFieldErrors(details))
    },
  }
}
