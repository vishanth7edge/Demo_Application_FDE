// Pure validation rules. Each field validator returns an error message, or undefined when valid.

export const USERNAME_MIN_LENGTH = 3
export const NAME_MIN_LENGTH = 2
export const PASSWORD_MIN_LENGTH = 8

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateRequired(value: string, label: string): string | undefined {
  return value.trim() === '' ? `${label} is required` : undefined
}

export function validateUsername(value: string): string | undefined {
  const required = validateRequired(value, 'Username')
  if (required !== undefined) {
    return required
  }
  return value.trim().length < USERNAME_MIN_LENGTH
    ? `Username must be at least ${String(USERNAME_MIN_LENGTH)} characters`
    : undefined
}

export function validatePersonName(value: string, label: string): string | undefined {
  const required = validateRequired(value, label)
  if (required !== undefined) {
    return required
  }
  return value.trim().length < NAME_MIN_LENGTH
    ? `${label} must be at least ${String(NAME_MIN_LENGTH)} characters`
    : undefined
}

export function validateEmail(value: string): string | undefined {
  const required = validateRequired(value, 'Email')
  if (required !== undefined) {
    return required
  }
  return EMAIL_PATTERN.test(value.trim()) ? undefined : 'Enter a valid email address'
}

// Strength rules for a new password (signup). Login only checks that a password was entered.
export function validateNewPassword(value: string): string | undefined {
  if (value === '') {
    return 'Password is required'
  }
  if (value.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${String(PASSWORD_MIN_LENGTH)} characters`
  }
  if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) {
    return 'Password must contain a letter and a number'
  }
  return undefined
}

export function validateConfirmPassword(
  password: string,
  confirmPassword: string,
): string | undefined {
  if (confirmPassword === '') {
    return 'Confirm your password'
  }
  return confirmPassword === password ? undefined : 'Passwords do not match'
}

export type FormErrors<K extends string> = Partial<Record<K, string>>

// Drops the fields that passed, so the result only contains messages to show.
function collectErrors<K extends string>(results: Record<K, string | undefined>): FormErrors<K> {
  const errors: FormErrors<K> = {}
  for (const key of Object.keys(results) as K[]) {
    const message = results[key]
    if (message !== undefined) {
      errors[key] = message
    }
  }
  return errors
}

export function hasErrors<K extends string>(errors: FormErrors<K>): boolean {
  return Object.keys(errors).length > 0
}

export interface LoginValues {
  username: string
  password: string
}

export function validateLoginForm(values: LoginValues): FormErrors<keyof LoginValues> {
  return collectErrors({
    username: validateUsername(values.username),
    password: values.password === '' ? 'Password is required' : undefined,
  })
}

export interface SignupValues {
  firstName: string
  lastName: string
  email: string
  password: string
  confirmPassword: string
}

export function validateSignupForm(values: SignupValues): FormErrors<keyof SignupValues> {
  return collectErrors({
    firstName: validatePersonName(values.firstName, 'First name'),
    lastName: validatePersonName(values.lastName, 'Last name'),
    email: validateEmail(values.email),
    password: validateNewPassword(values.password),
    confirmPassword: validateConfirmPassword(values.password, values.confirmPassword),
  })
}

// ── Products ─────────────────────────────────────────────────────────────────────────────

export const PRODUCT_NAME_MIN_LENGTH = 2
export const PRODUCT_DESCRIPTION_MAX_LENGTH = 1000
export const IMAGE_MAX_BYTES = 2 * 1024 * 1024
// One main image plus thumbnails, as in the design's four slots.
export const MAX_PRODUCT_IMAGES = 4
export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const

const PRICE_PATTERN = /^\d+(\.\d{1,2})?$/
// L*W*H, e.g. "10*20*5" or "10.5 x 20 x 5"
const SIZE_PATTERN = /^\d+(\.\d+)?\s*[*xX×]\s*\d+(\.\d+)?\s*[*xX×]\s*\d+(\.\d+)?$/

export interface ProductValues {
  name: string
  category: string
  description: string
  form: string
  safety: string
  uom: string
  ecoFriendly: boolean
  handleWithCare: boolean
  ratePerUnit: string
  marketSellingPrice: string
  saleProfitMargin: string
  productType: string
  productSize: string
  productVariant: string
  productColor: string
}

export type ProductTextField = {
  [K in keyof ProductValues]: ProductValues[K] extends string ? K : never
}[keyof ProductValues]

export const EMPTY_PRODUCT_VALUES: ProductValues = {
  name: '',
  category: '',
  description: '',
  form: '',
  safety: '',
  uom: '',
  ecoFriendly: false,
  handleWithCare: false,
  ratePerUnit: '',
  marketSellingPrice: '',
  saleProfitMargin: '',
  productType: '',
  productSize: '',
  productVariant: '',
  productColor: '',
}

// A positive amount with at most two decimals. Empty is an error only when `required`.
export function validatePrice(value: string, label: string, required: boolean): string | undefined {
  const trimmed = value.trim()
  if (trimmed === '') {
    return required ? `${label} is required` : undefined
  }
  if (!PRICE_PATTERN.test(trimmed) || Number(trimmed) <= 0) {
    return `${label} must be a positive amount with up to 2 decimals`
  }
  return undefined
}

export function validatePercentage(value: string, label: string): string | undefined {
  const trimmed = value.trim()
  if (trimmed === '') {
    return undefined
  }
  const number = Number(trimmed)
  return Number.isFinite(number) && number >= 0 && number <= 100
    ? undefined
    : `${label} must be a number between 0 and 100`
}

export function validateProductSize(value: string): string | undefined {
  const trimmed = value.trim()
  return trimmed === '' || SIZE_PATTERN.test(trimmed)
    ? undefined
    : 'Product size must look like L*W*H, for example 10*20*5'
}

export function validateProductForm(values: ProductValues): FormErrors<ProductTextField> {
  const name = values.name.trim()
  return collectErrors<ProductTextField>({
    name:
      name === ''
        ? 'Product name is required'
        : name.length < PRODUCT_NAME_MIN_LENGTH
          ? `Product name must be at least ${String(PRODUCT_NAME_MIN_LENGTH)} characters`
          : undefined,
    category: values.category === '' ? 'Choose a product category' : undefined,
    description:
      values.description.length > PRODUCT_DESCRIPTION_MAX_LENGTH
        ? `Description must be at most ${String(PRODUCT_DESCRIPTION_MAX_LENGTH)} characters`
        : undefined,
    form: undefined,
    safety: undefined,
    uom: undefined,
    ratePerUnit: validatePrice(values.ratePerUnit, 'Rate per unit', true),
    marketSellingPrice: validatePrice(values.marketSellingPrice, 'Market selling price', false),
    saleProfitMargin: validatePercentage(values.saleProfitMargin, 'Sale profit margin'),
    productType: undefined,
    productSize: validateProductSize(values.productSize),
    productVariant: undefined,
    productColor: undefined,
  })
}

// Only the parts of a File the rules need, so tests can pass plain objects.
export interface FileInfo {
  type: string
  size: number
}

export function validateImageFile(file: FileInfo): string | undefined {
  if (!(IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return 'Choose a JPG, PNG or WebP image'
  }
  if (file.size > IMAGE_MAX_BYTES) {
    return 'Image must be 2 MB or smaller'
  }
  return undefined
}
