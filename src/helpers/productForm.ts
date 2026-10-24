import { type FormErrors, validateRequired, type ValidationError } from './validators.ts'

export const CATEGORY_OPTIONS = ['Construction', 'Electrical', 'Plumbing', 'Hardware', 'Paints']
export const FORM_OPTIONS = ['Powder', 'Liquid', 'Solid', 'Gas']
export const SAFETY_OPTIONS = ['Flammable', 'Non-flammable', 'Corrosive', 'Toxic']
export const UOM_OPTIONS = ['Per Unit', 'Per Kg', 'Per Box', 'Per Litre']

export interface ProductFormValues {
  name: string
  category: string
  description: string
  form: string
  safety: string
  uom: string
  ecoFriendly: boolean
  handleWithCare: boolean
  ratePerUnit: string
  marketPrice: string
  productType: string
  productSize: string
  productVariant: string
  productColor: string
}

export type StringField = {
  [K in keyof ProductFormValues]: ProductFormValues[K] extends string ? K : never
}[keyof ProductFormValues]

export const EMPTY_PRODUCT_FORM: ProductFormValues = {
  name: '',
  category: '',
  description: '',
  form: '',
  safety: '',
  uom: '',
  ecoFriendly: false,
  handleWithCare: false,
  ratePerUnit: '',
  marketPrice: '',
  productType: '',
  productSize: '',
  productVariant: '',
  productColor: '',
}

export type RequiredProductField =
  'name' | 'category' | 'description' | 'form' | 'safety' | 'uom' | 'ratePerUnit' | 'marketPrice'

export type ProductFormErrors = FormErrors<Pick<ProductFormValues, RequiredProductField>>

export const NO_PRODUCT_ERRORS: ProductFormErrors = {
  name: null,
  category: null,
  description: null,
  form: null,
  safety: null,
  uom: null,
  ratePerUnit: null,
  marketPrice: null,
}

function validatePrice(value: string, label: string): ValidationError {
  const required = validateRequired(value, label)
  if (required !== null) {
    return required
  }
  const amount = Number(value)
  return Number.isFinite(amount) && amount > 0 ? null : `${label} must be a positive number`
}

export function validateProductForm(values: ProductFormValues): ProductFormErrors {
  return {
    name: validateRequired(values.name, 'Product name'),
    category: validateRequired(values.category, 'Product category'),
    description: validateRequired(values.description, 'Product description'),
    form: validateRequired(values.form, 'Form'),
    safety: validateRequired(values.safety, 'Safety'),
    uom: validateRequired(values.uom, 'UOM'),
    ratePerUnit: validatePrice(values.ratePerUnit, 'Rate per unit'),
    marketPrice: validatePrice(values.marketPrice, 'Market selling price'),
  }
}

/** Profit as a percentage of the rate, e.g. rate 200 and price 300 gives "50%". */
export function calculateMargin(ratePerUnit: string, marketPrice: string): string {
  const rate = Number(ratePerUnit)
  const price = Number(marketPrice)
  if (ratePerUnit.trim() === '' || marketPrice.trim() === '' || !(rate > 0) || !(price > 0)) {
    return ''
  }
  return `${String(Math.round(((price - rate) / rate) * 100))}%`
}
