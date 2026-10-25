import { CATEGORY_OPTIONS, NAME_MAX_LENGTH, STATUS_OPTIONS } from '../application/index.ts'
import type { ProductFormValues } from '../application/index.ts'
import { Button } from '../../../shared/ui/Button.tsx'
import { Card } from '../../../shared/ui/Card.tsx'
import { SelectField } from '../../../shared/ui/SelectField.tsx'
import { TextField } from '../../../shared/ui/TextField.tsx'
import { PriceField } from './PriceField.tsx'
import type { ProductForm as ProductFormState } from './useProductForm.ts'

interface FieldBinding {
  name: string
  value: string
  onChange: (event: { target: { value: string } }) => void
}

export interface ProductFormProps {
  form: ProductFormState
  submitting: boolean
  submitLabel: string
  onSubmit: () => void
  onCancel: () => void
}

export function ProductForm({
  form,
  submitting,
  submitLabel,
  onSubmit,
  onCancel,
}: ProductFormProps): React.JSX.Element {
  const { values, errors } = form
  const bind = (field: keyof ProductFormValues): FieldBinding => ({
    name: field,
    value: values[field],
    onChange: (event: { target: { value: string } }): void => {
      form.setField(field, event.target.value)
    },
  })

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit()
      }}
    >
      <Card title="Product information" description="Fields marked * are required.">
        <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <TextField
              label="Product name"
              required
              maxLength={NAME_MAX_LENGTH}
              placeholder="e.g. Wireless Ergonomic Mouse"
              autoComplete="off"
              {...bind('name')}
              error={errors.name}
              aside={
                <span className="text-xs text-slate-400 tabular-nums">
                  {values.name.length}/{NAME_MAX_LENGTH}
                </span>
              }
            />
          </div>
          <TextField
            label="SKU"
            required
            placeholder="e.g. EL-1001"
            autoComplete="off"
            {...bind('sku')}
            error={errors.sku}
            hint="4–20 letters, numbers or hyphens. Saved in upper case; must be unique."
          />
          <SelectField
            label="Category"
            required
            placeholder="Select a category"
            options={CATEGORY_OPTIONS}
            {...bind('category')}
            error={errors.category}
          />
          <PriceField
            label="Price"
            required
            placeholder="0.00"
            {...bind('price')}
            error={errors.price}
            hint="Between $0.01 and $99,999.99"
          />
          <TextField
            label="Quantity in stock"
            required
            inputMode="numeric"
            placeholder="0"
            {...bind('quantity')}
            error={errors.quantity}
            hint="Whole number from 0 to 10,000"
          />
          <SelectField
            label="Status"
            required
            options={STATUS_OPTIONS}
            {...bind('status')}
            error={errors.status}
          />
        </div>
      </Card>

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button variant="secondary" disabled={submitting} onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting}>
          {submitting ? 'Saving…' : submitLabel}
        </Button>
      </div>
    </form>
  )
}
