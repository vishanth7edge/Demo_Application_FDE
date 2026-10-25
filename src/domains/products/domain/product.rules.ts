// Business rules for products, shared by the add/edit form and the API server.

import { PRODUCT_CATEGORIES, PRODUCT_STATUSES } from './product.types.ts'
import type {
  ProductCategory,
  ProductFieldErrors,
  ProductInput,
  ProductListQuery,
  ProductStatus,
} from './product.types.ts'

export const PRODUCT_NAME_MIN_LENGTH = 3
export const PRODUCT_NAME_MAX_LENGTH = 100
export const SKU_MIN_LENGTH = 4
export const SKU_MAX_LENGTH = 20
export const PRICE_MIN = 0.01
export const PRICE_MAX = 99_999.99
export const QUANTITY_MAX = 10_000
/** Products with this many units or fewer (including zero) count as low stock. */
export const LOW_STOCK_THRESHOLD = 10

export const PAGE_SIZE_OPTIONS = [5, 10, 25, 50] as const
export const DEFAULT_PAGE_SIZE = 10

export const DEFAULT_LIST_QUERY: ProductListQuery = {
  search: '',
  category: '',
  status: '',
  sort: 'createdAt',
  order: 'desc',
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
}

export const STATUS_LABELS: Record<ProductStatus, string> = {
  active: 'Active',
  inactive: 'Inactive',
  discontinued: 'Discontinued',
}

const SKU_PATTERN = /^[A-Za-z0-9-]+$/

export type StockLevel = 'out' | 'low' | 'in'

export function getStockLevel(quantity: number): StockLevel {
  if (quantity <= 0) {
    return 'out'
  }
  return quantity <= LOW_STOCK_THRESHOLD ? 'low' : 'in'
}

export function isProductCategory(value: string): value is ProductCategory {
  return (PRODUCT_CATEGORIES as readonly string[]).includes(value)
}

export function isProductStatus(value: string): value is ProductStatus {
  return (PRODUCT_STATUSES as readonly string[]).includes(value)
}

function hasAtMostTwoDecimals(value: number): boolean {
  return Math.abs(Math.round(value * 100) - value * 100) < 1e-6
}

function validateName(raw: string): string | undefined {
  const name = raw
  if (name.length === 0) {
    return 'Product name is required'
  }
  if (name.length < PRODUCT_NAME_MIN_LENGTH) {
    return `Product name must be at least ${String(PRODUCT_NAME_MIN_LENGTH)} characters`
  }
  if (name.length > PRODUCT_NAME_MAX_LENGTH) {
    return `Product name must be ${String(PRODUCT_NAME_MAX_LENGTH)} characters or fewer`
  }
  return undefined
}

function validateSku(raw: string): string | undefined {
  const sku = raw.trim()
  if (sku.length === 0) {
    return 'SKU is required'
  }
  if (sku.length < SKU_MIN_LENGTH || sku.length > SKU_MAX_LENGTH || !SKU_PATTERN.test(sku)) {
    return `SKU must be ${String(SKU_MIN_LENGTH)}–${String(SKU_MAX_LENGTH)} characters: letters, numbers and hyphens only`
  }
  return undefined
}

function validatePrice(price: number | null): string | undefined {
  if (price === null) {
    return 'Price is required'
  }
  if (!Number.isFinite(price)) {
    return 'Enter a valid price, for example 24.99'
  }
  if (price < 0 || price > PRICE_MAX) {
    return 'Price must be between $0.01 and $99,999.99'
  }
  if (!hasAtMostTwoDecimals(price)) {
    return 'Price can have at most 2 decimal places'
  }
  return undefined
}

function validateQuantity(quantity: number | null): string | undefined {
  if (quantity === null) {
    return 'Quantity is required'
  }
  if (!Number.isFinite(quantity)) {
    return 'Enter a valid quantity, for example 25'
  }
  if (quantity < 0 || quantity > QUANTITY_MAX) {
    return 'Quantity must be between 0 and 10,000'
  }
  return undefined
}

export function validateProductInput(input: ProductInput): ProductFieldErrors {
  const errors: ProductFieldErrors = {}
  const name = validateName(input.name)
  const sku = validateSku(input.sku)
  const price = validatePrice(input.price)
  const quantity = validateQuantity(input.quantity)
  if (name !== undefined) {
    errors.name = name
  }
  if (sku !== undefined) {
    errors.sku = sku
  }
  if (!isProductCategory(input.category)) {
    errors.category = 'Select a category'
  }
  if (price !== undefined) {
    errors.price = price
  }
  if (quantity !== undefined) {
    errors.quantity = quantity
  }
  if (!isProductStatus(input.status)) {
    errors.status = 'Select a status'
  }
  return errors
}

export function hasFieldErrors(errors: ProductFieldErrors): boolean {
  return Object.keys(errors).length > 0
}
