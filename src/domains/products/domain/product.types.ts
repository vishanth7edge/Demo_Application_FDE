// Pure product types and value lists. The API server imports this file too, so it must stay
// free of browser and React dependencies.

export const PRODUCT_CATEGORIES = [
  'Electronics',
  'Home & Kitchen',
  'Office Supplies',
  'Sports & Outdoors',
  'Apparel',
  'Beauty & Health',
] as const
export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number]

export const PRODUCT_STATUSES = ['active', 'inactive', 'discontinued'] as const
export type ProductStatus = (typeof PRODUCT_STATUSES)[number]

export const PRODUCT_SORT_FIELDS = [
  'name',
  'category',
  'price',
  'quantity',
  'status',
  'createdAt',
] as const
export type ProductSortField = (typeof PRODUCT_SORT_FIELDS)[number]
export type SortOrder = 'asc' | 'desc'

export interface Product {
  id: number
  name: string
  sku: string
  category: ProductCategory
  price: number
  quantity: number
  status: ProductStatus
  createdAt: string
  updatedAt: string
}

/** What the add/edit form sends. Numbers are `null` when the field was left empty. */
export interface ProductInput {
  name: string
  sku: string
  category: string
  price: number | null
  quantity: number | null
  status: string
}

export type ProductField = keyof ProductInput
export type ProductFieldErrors = Partial<Record<ProductField, string>>

export interface ProductListQuery {
  search: string
  category: ProductCategory | ''
  status: ProductStatus | ''
  sort: ProductSortField
  order: SortOrder
  page: number
  pageSize: number
}

export interface ProductListResult {
  items: Product[]
  total: number
  page: number
  pageSize: number
}
