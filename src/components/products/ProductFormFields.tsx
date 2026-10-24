import CheckboxField from '../CheckboxField.tsx'
import SelectField from '../SelectField.tsx'
import TextField from '../TextField.tsx'
import {
  calculateMargin,
  CATEGORY_OPTIONS,
  FORM_OPTIONS,
  type ProductFormErrors,
  type ProductFormValues,
  SAFETY_OPTIONS,
  type StringField,
  UOM_OPTIONS,
} from '../../helpers/productForm.ts'
import BrochureUploader from './BrochureUploader.tsx'
import FormSection from './FormSection.tsx'

export interface ProductFormFieldsProps {
  values: ProductFormValues
  errors: ProductFormErrors
  onChange: <K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) => void
}

const HALF_GRID = 'grid grid-cols-1 gap-5 sm:grid-cols-2'

export default function ProductFormFields({
  values,
  errors,
  onChange,
}: ProductFormFieldsProps): React.JSX.Element {
  const text = (key: StringField): { value: string; onChange: (value: string) => void } => ({
    value: values[key],
    onChange: (value) => {
      onChange(key, value)
    },
  })

  return (
    <div className="flex flex-col gap-8">
      <FormSection title="Product Basic Details">
        <TextField label="Product Name" required error={errors.name} {...text('name')} />
        <SelectField
          label="Product Category"
          options={CATEGORY_OPTIONS}
          error={errors.category}
          {...text('category')}
        />
        <TextField
          label="Product Description"
          multiline
          required
          error={errors.description}
          {...text('description')}
        />
      </FormSection>

      <FormSection title="Additional Product Atributes">
        <div className={HALF_GRID}>
          <SelectField label="Form" options={FORM_OPTIONS} error={errors.form} {...text('form')} />
          <SelectField
            label="Safety"
            options={SAFETY_OPTIONS}
            error={errors.safety}
            {...text('safety')}
          />
          <SelectField label="UOM" options={UOM_OPTIONS} error={errors.uom} {...text('uom')} />
        </div>
        <div className="flex flex-wrap gap-x-10 gap-y-3">
          <CheckboxField
            label="Eco Friendly"
            checked={values.ecoFriendly}
            onChange={(checked) => {
              onChange('ecoFriendly', checked)
            }}
          />
          <CheckboxField
            label="Handle with Care"
            checked={values.handleWithCare}
            onChange={(checked) => {
              onChange('handleWithCare', checked)
            }}
          />
        </div>
      </FormSection>

      <FormSection title="Pricing and Rate Settings">
        <div className={HALF_GRID}>
          <TextField
            label="Rate per Unit"
            inputMode="decimal"
            required
            error={errors.ratePerUnit}
            {...text('ratePerUnit')}
          />
          <TextField
            label="Market Selling Price"
            inputMode="decimal"
            required
            error={errors.marketPrice}
            {...text('marketPrice')}
          />
          <TextField
            label="Sale Profit Margin"
            readOnly
            value={calculateMargin(values.ratePerUnit, values.marketPrice)}
            onChange={() => undefined}
          />
        </div>
      </FormSection>

      <FormSection title="Other Details (optional)">
        <div className={HALF_GRID}>
          <TextField label="Product Type" {...text('productType')} />
          <TextField label="Product Size(L*W*H)" {...text('productSize')} />
          <TextField label="Product Variant" {...text('productVariant')} />
          <TextField label="Product Color" {...text('productColor')} />
        </div>
      </FormSection>

      <FormSection title="Upload Product Brochure (optional)">
        <BrochureUploader />
      </FormSection>
    </div>
  )
}
