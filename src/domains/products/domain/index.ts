export {
  DEFAULT_LIST_QUERY,
  getStockLevel,
  hasFieldErrors,
  isProductCategory,
  isProductStatus,
  LOW_STOCK_THRESHOLD,
  PAGE_SIZE_OPTIONS,
  PRODUCT_NAME_MAX_LENGTH,
  STATUS_LABELS,
  validateProductInput,
} from './product.rules.ts'
export type { StockLevel } from './product.rules.ts'
export { PRODUCT_CATEGORIES, PRODUCT_SORT_FIELDS, PRODUCT_STATUSES } from './product.types.ts'
export type {
  Product,
  ProductCategory,
  ProductField,
  ProductFieldErrors,
  ProductInput,
  ProductListQuery,
  ProductListResult,
  ProductSortField,
  ProductStatus,
  SortOrder,
} from './product.types.ts'
