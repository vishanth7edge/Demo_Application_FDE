import { apiDelete, apiGet, apiPost, apiPut } from '../../../shared/api/apiClient.ts'
import type { ApiResult } from '../../../shared/api/apiClient.ts'
import {
  DEFAULT_LIST_QUERY,
  isProductCategory,
  isProductStatus,
  PAGE_SIZE_OPTIONS,
} from '../domain/product.rules.ts'
import { PRODUCT_SORT_FIELDS } from '../domain/product.types.ts'
import type {
  Product,
  ProductInput,
  ProductListQuery,
  ProductListResult,
  ProductSortField,
} from '../domain/product.types.ts'

function isSortField(value: string): value is ProductSortField {
  return (PRODUCT_SORT_FIELDS as readonly string[]).includes(value)
}

/** Reads the listing state from the URL so filters survive refresh, Back/Forward and links. */
export function parseListParams(params: URLSearchParams): ProductListQuery {
  const category = params.get('category') ?? ''
  const status = params.get('status') ?? ''
  const sort = params.get('sort') ?? ''
  const order = params.get('order')
  const page = Number(params.get('page') ?? '1')
  const pageSize = Number(params.get('pageSize') ?? String(DEFAULT_LIST_QUERY.pageSize))
  return {
    search: params.get('search') ?? '',
    category: isProductCategory(category) ? category : '',
    status: isProductStatus(status) ? status : '',
    sort: isSortField(sort) ? sort : DEFAULT_LIST_QUERY.sort,
    order: order === 'asc' || order === 'desc' ? order : DEFAULT_LIST_QUERY.order,
    page: Number.isInteger(page) && page > 0 ? page : 1,
    pageSize: (PAGE_SIZE_OPTIONS as readonly number[]).includes(pageSize)
      ? pageSize
      : DEFAULT_LIST_QUERY.pageSize,
  }
}

/** Inverse of parseListParams; default values are left out to keep URLs short. */
export function toListParams(query: ProductListQuery): URLSearchParams {
  const params = new URLSearchParams()
  if (query.search !== '') {
    params.set('search', query.search)
  }
  if (query.category !== '') {
    params.set('category', query.category)
  }
  if (query.status !== '') {
    params.set('status', query.status)
  }
  if (query.sort !== DEFAULT_LIST_QUERY.sort || query.order !== DEFAULT_LIST_QUERY.order) {
    params.set('sort', query.sort)
    params.set('order', query.order)
  }
  if (query.page !== 1) {
    params.set('page', String(query.page))
  }
  if (query.pageSize !== DEFAULT_LIST_QUERY.pageSize) {
    params.set('pageSize', String(query.pageSize))
  }
  return params
}

export function hasActiveFilters(query: ProductListQuery): boolean {
  return query.search.trim() !== '' || query.category !== '' || query.status !== ''
}

/** Clicking the active column flips the order; a new column starts ascending (dates: newest first). */
export function getNextSort(
  query: ProductListQuery,
  field: ProductSortField,
): Pick<ProductListQuery, 'sort' | 'order'> {
  if (query.sort === field) {
    return { sort: field, order: query.order === 'asc' ? 'desc' : 'asc' }
  }
  return { sort: field, order: field === 'createdAt' ? 'desc' : 'asc' }
}

export function getTotalPages(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / pageSize))
}

export function fetchProducts(query: ProductListQuery): Promise<ApiResult<ProductListResult>> {
  const params = new URLSearchParams({
    sort: query.sort,
    order: query.order,
    page: String(query.page),
    pageSize: String(query.pageSize),
  })
  if (query.search !== '') {
    params.set('search', query.search)
  }
  if (query.category !== '') {
    params.set('category', query.category)
  }
  if (query.status !== '') {
    params.set('status', query.status)
  }
  return apiGet<ProductListResult>(`/api/products?${params.toString()}`)
}

// Product records rarely change, so the detail and edit pages share a cache and open instantly.
const productCache = new Map<number, Product>()

export async function fetchProduct(id: number): Promise<ApiResult<Product>> {
  const cached = productCache.get(id)
  if (cached !== undefined) {
    return { error: false, data: cached }
  }
  const result = await apiGet<Product>(`/api/products/${String(id)}`)
  if (!result.error) {
    productCache.set(id, result.data)
  }
  return result
}

export function createProduct(input: ProductInput): Promise<ApiResult<Product>> {
  return apiPost<Product>('/api/products', input)
}

export function updateProduct(id: number, input: ProductInput): Promise<ApiResult<Product>> {
  return apiPut<Product>(`/api/products/${String(id)}`, input)
}

export async function deleteProduct(id: number): Promise<ApiResult<null>> {
  const result = await apiDelete(`/api/products/${String(id)}`)
  if (!result.error) {
    productCache.delete(id)
  }
  return result
}
