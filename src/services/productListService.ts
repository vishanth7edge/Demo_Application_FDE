import { apiGet } from '../shared/httpClient.ts'
import { isRecord, parseProduct, UNEXPECTED_RESPONSE } from './productService.ts'

import type { ApiResult } from '../shared/httpClient.ts'
import type { Product } from './productService.ts'

export const PRODUCT_PAGE_SIZE = 10

export interface ProductListInput {
  search: string
  // A DummyJSON category slug ("furniture"), or '' for all.
  category: string
  // 1-based.
  page: number
}

export interface ProductListResult {
  products: Product[]
  total: number
}

const LIST_FIELDS = 'select=title,brand,category,price,thumbnail'

// DummyJSON pages with limit/skip, searches with /products/search?q= and filters with
// /products/category/<slug>, but cannot search inside a category. With a category, the whole
// category is loaded (a few dozen items at most) and searched and paged here instead.
export function productListPath({ search, category, page }: ProductListInput): string {
  const q = search.trim()
  if (category !== '') {
    return `/products/category/${encodeURIComponent(category)}?limit=0&${LIST_FIELDS}`
  }
  const paging = `limit=${String(PRODUCT_PAGE_SIZE)}&skip=${String((page - 1) * PRODUCT_PAGE_SIZE)}&${LIST_FIELDS}`
  return q === '' ? `/products?${paging}` : `/products/search?q=${encodeURIComponent(q)}&${paging}`
}

export async function listProducts(input: ProductListInput): Promise<ApiResult<ProductListResult>> {
  const result = await apiGet(productListPath(input))
  if (result.error) {
    return result
  }
  const data = result.data
  if (!isRecord(data) || !Array.isArray(data['products'])) {
    return UNEXPECTED_RESPONSE
  }
  const products = data['products']
    .map(parseProduct)
    .filter((product): product is Product => product !== null)
  if (input.category === '') {
    const total = typeof data['total'] === 'number' ? data['total'] : products.length
    return { error: false, data: { products, total } }
  }
  const q = input.search.trim().toLowerCase()
  const matches = q === '' ? products : products.filter((p) => p.title.toLowerCase().includes(q))
  const start = (input.page - 1) * PRODUCT_PAGE_SIZE
  return {
    error: false,
    data: { products: matches.slice(start, start + PRODUCT_PAGE_SIZE), total: matches.length },
  }
}

export async function listCategories(): Promise<ApiResult<string[]>> {
  const result = await apiGet('/products/category-list')
  if (result.error) {
    return result
  }
  return Array.isArray(result.data)
    ? {
        error: false,
        data: result.data.filter((item): item is string => typeof item === 'string'),
      }
    : UNEXPECTED_RESPONSE
}
