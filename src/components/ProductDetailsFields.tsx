import {
  CATEGORY_OPTIONS,
  FORM_OPTIONS,
  SAFETY_OPTIONS,
  UOM_OPTIONS,
  withCurrentOption,
} from '../helpers/productOptions.ts'
import { Checkbox } from './Checkbox.tsx'
import { FormSection } from './FormSection.tsx'
import { Input } from './Input.tsx'
import { Select } from './Select.tsx'
import { TextArea } from './TextArea.tsx'

import type { FormErrors, ProductTextField, ProductValues } from '../helpers/validators.ts'

export interface ProductDetailsFieldsProps {
  values: ProductValues
  errors: FormErrors<ProductTextField>
  onTextChange: (field: ProductTextField, value: string) => void
  onToggle: (field: 'ecoFriendly' | 'handleWithCare', checked: boolean) => void
  disabled: boolean
}

// The right-hand card of the product form: every field except the image.
export function ProductDetailsFields({
  values,
  errors,
  onTextChange,
  onToggle,
  disabled,
}: ProductDetailsFieldsProps): React.JSX.Element {
  const text = (
    field: ProductTextField,
  ): {
    name: string
    value: string
    error: string | undefined
    disabled: boolean
    onChange: (value: string) => void
  } => ({
    name: field,
    value: values[field],
    error: errors[field],
    disabled,
    onChange: (value: string) => {
      onTextChange(field, value)
    },
  })

  return (
    <div className="flex flex-col gap-10">
      <FormSection title="Product Basic Details">
        <Input label="Product Name" placeholder="Product name" {...text('name')} />
        <Select
          label="Product Category"
          placeholder="Choose a category"
          options={withCurrentOption(CATEGORY_OPTIONS, values.category)}
          {...text('category')}
        />
        <TextArea
          label="Product Description"
          placeholder="Usage, size or color"
          {...text('description')}
        />
      </FormSection>

      <FormSection title="Additional Product Attributes">
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Form"
            placeholder="Choose a form"
            options={FORM_OPTIONS}
            {...text('form')}
          />
          <Select
            label="Safety"
            placeholder="Choose a safety class"
            options={SAFETY_OPTIONS}
            {...text('safety')}
          />
          <Select
            label="UOM"
            placeholder="Unit of measure"
            options={UOM_OPTIONS}
            {...text('uom')}
          />
        </div>
        <div className="flex flex-wrap gap-x-8 gap-y-3">
          <Checkbox
            label="Eco Friendly"
            name="ecoFriendly"
            checked={values.ecoFriendly}
            disabled={disabled}
            onChange={(checked) => {
              onToggle('ecoFriendly', checked)
            }}
          />
          <Checkbox
            label="Handle with Care"
            name="handleWithCare"
            checked={values.handleWithCare}
            disabled={disabled}
            onChange={(checked) => {
              onToggle('handleWithCare', checked)
            }}
          />
        </div>
      </FormSection>

      <FormSection title="Pricing and Rate Settings">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Rate per Unit"
            inputMode="decimal"
            placeholder="0.00"
            {...text('ratePerUnit')}
          />
          <Input
            label="Market Selling Price"
            inputMode="decimal"
            placeholder="0.00"
            {...text('marketSellingPrice')}
          />
          <Input
            label="Sale Profit Margin (%)"
            inputMode="decimal"
            placeholder="0"
            {...text('saleProfitMargin')}
          />
        </div>
      </FormSection>

      <FormSection title="Other Details (optional)">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Product Type" {...text('productType')} />
          <Input label="Product Size (L*W*H)" placeholder="10*20*5" {...text('productSize')} />
          <Input label="Product Variant" {...text('productVariant')} />
          <Input label="Product Color" {...text('productColor')} />
        </div>
      </FormSection>
    </div>
  )
}
