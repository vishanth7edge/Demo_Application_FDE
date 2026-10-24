import { type ApiResult, apiDelete, apiGet, apiPost, isRecord } from '../shared/apiClient.ts'

export const PRODUCTS_PAGE_SIZE = 10

export interface Product {
  id: number
  title: string
  description: string
  category: string
  brand: string
  price: number
  thumbnail: string
  images: string[]
  /** "width*height*depth", or an empty string when the API sends no dimensions. */
  size: string
}

export interface ProductPage {
  products: Product[]
  total: number
}

export interface ListProductsInput {
  query: string
  /** Zero-based page index. */
  page: number
}

export interface NewProductInput {
  title: string
  description: string
  category: string
  price: number
  [attribute: string]: string | number | boolean
}

export interface CreatedProduct {
  id: number
}

function readString(record: Record<string, unknown>, key: string): string {
  const value = record[key]
  return typeof value === 'string' ? value : ''
}

function readSize(value: unknown): string {
  if (
    isRecord(value) &&
    typeof value['width'] === 'number' &&
    typeof value['height'] === 'number' &&
    typeof value['depth'] === 'number'
  ) {
    return `${String(value['width'])}*${String(value['height'])}*${String(value['depth'])}`
  }
  return ''
}

function parseProduct(json: unknown): Product | null {
  if (
    !isRecord(json) ||
    typeof json['id'] !== 'number' ||
    typeof json['title'] !== 'string' ||
    typeof json['price'] !== 'number'
  ) {
    return null
  }
  const images = Array.isArray(json['images'])
    ? json['images'].filter((image): image is string => typeof image === 'string')
    : []
  return {
    id: json['id'],
    title: json['title'],
    price: json['price'],
    description: readString(json, 'description'),
    category: readString(json, 'category'),
    brand: readString(json, 'brand'),
    thumbnail: readString(json, 'thumbnail'),
    images,
    size: readSize(json['dimensions']),
  }
}

function parseProductPage(json: unknown): ProductPage | null {
  if (!isRecord(json) || !Array.isArray(json['products']) || typeof json['total'] !== 'number') {
    return null
  }
  const products: Product[] = []
  for (const item of json['products'] as unknown[]) {
    const product = parseProduct(item)
    if (product === null) {
      return null
    }
    products.push(product)
  }
  return { products, total: json['total'] }
}

function parseCreatedProduct(json: unknown): CreatedProduct | null {
  return isRecord(json) && typeof json['id'] === 'number' ? { id: json['id'] } : null
}

/** GET /products (or /products/search when `query` is set), one page at a time. */
export function listProducts({ query, page }: ListProductsInput): Promise<ApiResult<ProductPage>> {
  const paging = `limit=${String(PRODUCTS_PAGE_SIZE)}&skip=${String(page * PRODUCTS_PAGE_SIZE)}`
  const trimmed = query.trim()
  const path =
    trimmed === ''
      ? `/products?${paging}`
      : `/products/search?q=${encodeURIComponent(trimmed)}&${paging}`
  return apiGet(path, parseProductPage)
}

export function getProduct(id: number): Promise<ApiResult<Product>> {
  return apiGet(`/products/${String(id)}`, parseProduct)
}

/** DELETE /products/:id. DummyJSON only simulates the delete. */
export function deleteProduct(id: number): Promise<ApiResult<CreatedProduct>> {
  return apiDelete(`/products/${String(id)}`, parseCreatedProduct)
}

/** POST /products/add. DummyJSON only simulates the insert (nothing is stored). */
export function addProduct(input: NewProductInput): Promise<ApiResult<CreatedProduct>> {
  return apiPost('/products/add', input, parseCreatedProduct)
}
