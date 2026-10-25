// Add/edit form state <-> API input, plus display helpers for the product screens.

import type { FieldError } from '../../../shared/api/apiClient.ts'
import {
  getStockLevel,
  PRODUCT_NAME_MAX_LENGTH,
  STATUS_LABELS,
  validateProductInput,
} from '../domain/product.rules.ts'
import type { StockLevel } from '../domain/product.rules.ts'
import { PRODUCT_CATEGORIES, PRODUCT_STATUSES } from '../domain/product.types.ts'
import type {
  Product,
  ProductField,
  ProductFieldErrors,
  ProductInput,
  ProductStatus,
} from '../domain/product.types.ts'

/** Raw input values exactly as typed. */
export interface ProductFormValues {
  name: string
  sku: string
  category: string
  price: string
  quantity: string
  status: string
}

export const EMPTY_PRODUCT_FORM: ProductFormValues = {
  name: '',
  sku: '',
  category: '',
  price: '',
  quantity: '',
  status: 'active',
}

export const NAME_MAX_LENGTH = PRODUCT_NAME_MAX_LENGTH

export const CATEGORY_OPTIONS = PRODUCT_CATEGORIES.map((category) => ({
  value: category,
  label: category,
}))

export const STATUS_OPTIONS = PRODUCT_STATUSES.map((status) => ({
  value: status,
  label: STATUS_LABELS[status],
}))

const PRODUCT_FIELDS: readonly ProductField[] = [
  'name',
  'sku',
  'category',
  'price',
  'quantity',
  'status',
]

/** `null` for an empty field, `NaN` for text that is not a plain decimal number. */
function parseDecimal(raw: string): number | null {
  const value = raw.trim()
  if (value === '') {
    return null
  }
  return /^-?\d+(\.\d+)?$/.test(value) ? Number(value) : Number.NaN
}

export function toProductInput(values: ProductFormValues): ProductInput {
  return {
    name: values.name,
    sku: values.sku,
    category: values.category,
    price: parseDecimal(values.price),
    quantity: parseDecimal(values.quantity),
    status: values.status,
  }
}

export function toFormValues(product: Product): ProductFormValues {
  return {
    name: product.name,
    sku: product.sku,
    category: product.category,
    price: product.price.toFixed(2),
    quantity: String(product.quantity),
    status: product.status,
  }
}

export function validateProductForm(values: ProductFormValues): ProductFieldErrors {
  return validateProductInput(toProductInput(values))
}

export function toFieldErrors(details: FieldError[]): ProductFieldErrors {
  const errors: ProductFieldErrors = {}
  for (const detail of details) {
    const field = PRODUCT_FIELDS.find((candidate) => candidate === detail.field)
    if (field !== undefined) {
      errors[field] = detail.message
    }
  }
  return errors
}

export function getStatusLabel(status: ProductStatus): string {
  return STATUS_LABELS[status]
}

export function getProductStockLevel(product: Pick<Product, 'quantity'>): StockLevel {
  return getStockLevel(product.quantity)
}

export function getInventoryValue(product: Pick<Product, 'price' | 'quantity'>): number {
  return Math.round(product.price * product.quantity * 100) / 100
}
