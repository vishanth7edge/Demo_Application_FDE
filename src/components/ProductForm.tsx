import { useState } from 'react'
import { Link } from 'react-router'

import { EMPTY_PRODUCT_VALUES, hasErrors, validateProductForm } from '../helpers/validators.ts'
import { Button } from './Button.tsx'
import { FormSection } from './FormSection.tsx'
import { ImageUpload } from './ImageUpload.tsx'
import { ProductDetailsFields } from './ProductDetailsFields.tsx'

import type { FormErrors, ProductTextField, ProductValues } from '../helpers/validators.ts'

export interface ProductFormProps {
  mode: 'add' | 'edit'
  initialValues?: Partial<ProductValues> | undefined
  // Edit mode: the saved image, shown until a new one is picked.
  currentImageUrl?: string | undefined
  isSubmitting?: boolean | undefined
  submitError?: string | null | undefined
  // Called with valid values only; images are the newly picked ones (first = main image).
  onSubmit: (values: ProductValues, images: Blob[]) => void
}

export function ProductForm({
  mode,
  initialValues,
  currentImageUrl,
  isSubmitting = false,
  submitError = null,
  onSubmit,
}: ProductFormProps): React.JSX.Element {
  const [values, setValues] = useState<ProductValues>(() => ({
    ...EMPTY_PRODUCT_VALUES,
    ...initialValues,
  }))
  const [errors, setErrors] = useState<FormErrors<ProductTextField>>({})
  const [images, setImages] = useState<Blob[]>([])

  const handleTextChange = (field: ProductTextField, value: string): void => {
    setValues((current) => ({ ...current, [field]: value }))
    // Clear only this field's error; the others stay until the next submit.
    setErrors(({ [field]: _cleared, ...rest }) => rest)
  }

  const handleToggle = (field: 'ecoFriendly' | 'handleWithCare', checked: boolean): void => {
    setValues((current) => ({ ...current, [field]: checked }))
  }

  const handleSubmit = (event: React.SubmitEvent<HTMLFormElement>): void => {
    event.preventDefault()
    if (isSubmitting) {
      return
    }
    const nextErrors = validateProductForm(values)
    setErrors(nextErrors)
    if (!hasErrors(nextErrors)) {
      onSubmit(values, images)
    }
  }

  const submitLabel = mode === 'add' ? 'Add Product' : 'Save Changes'

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col">
      {submitError !== null && (
        <p
          role="alert"
          className="mb-4 rounded-lg border border-error bg-surface px-4 py-3 text-body-medium text-error"
        >
          {submitError}
        </p>
      )}
      {hasErrors(errors) && (
        <p role="alert" className="mb-4 text-body-medium text-error">
          Check the highlighted fields.
        </p>
      )}

      <div className="grid items-start gap-4 lg:grid-cols-[2fr_3fr]">
        <div className="rounded-lg bg-surface p-5 md:p-6">
          <FormSection title="Upload Product Image">
            <ImageUpload
              files={images}
              onChange={setImages}
              currentImageUrl={currentImageUrl}
              disabled={isSubmitting}
            />
          </FormSection>
        </div>
        <div className="rounded-lg bg-surface p-5 md:p-6">
          <ProductDetailsFields
            values={values}
            errors={errors}
            onTextChange={handleTextChange}
            onToggle={handleToggle}
            disabled={isSubmitting}
          />
        </div>
      </div>

      {/* Footer bar as in the design. Negative offsets cancel <main>'s padding so it sits flush. */}
      <div className="sticky -bottom-4 -mx-4 mt-6 -mb-4 flex items-center justify-between gap-4 border-t border-outline bg-surface px-4 py-4 md:-bottom-8 md:-mx-8 md:-mb-8 md:px-8">
        <Link to="/products" className="text-label-large text-brand hover:underline">
          Cancel
        </Link>
        <Button type="submit" disabled={isSubmitting} className="min-w-36 disabled:cursor-wait">
          {isSubmitting ? 'Saving…' : submitLabel}
        </Button>
      </div>
    </form>
  )
}
