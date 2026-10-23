import { apiDelete, apiGet, apiPost, apiPut } from '../shared/httpClient.ts'

import type { ProductValues } from '../helpers/validators.ts'
import type { ApiResult } from '../shared/httpClient.ts'

// DummyJSON (https://dummyjson.com/docs/products) stands in for the real API. Writes are not
// persisted: /products/add always answers with id 195, and fields come back as strings.

export interface Product {
  id: number
  title: string
  description: string
  category: string
  price: number
  thumbnail: string
  brand: string
  // Gallery images; DummyJSON products have 1 to 5.
  images: string[]
  // "w × h × d" from DummyJSON's dimensions, or '' when missing.
  size: string
}

export interface SavedProduct {
  id: number
}

export const UNEXPECTED_RESPONSE = {
  error: true,
  message: 'Unexpected response from the server',
} as const

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function readString(data: Record<string, unknown>, key: string): string {
  const value = data[key]
  return typeof value === 'string' ? value : ''
}

function readSize(value: unknown): string {
  if (!isRecord(value)) {
    return ''
  }
  const parts = [value['width'], value['height'], value['depth']]
  return parts.every((part) => typeof part === 'number') ? parts.map(String).join(' × ') : ''
}

// Narrows one DummyJSON product; missing optional fields become '' / [] / 0.
export function parseProduct(data: unknown): Product | null {
  if (!isRecord(data) || typeof data['id'] !== 'number' || typeof data['title'] !== 'string') {
    return null
  }
  const price = Number(data['price'])
  const images = data['images']
  return {
    id: data['id'],
    title: data['title'],
    description: readString(data, 'description'),
    category: readString(data, 'category'),
    price: Number.isFinite(price) ? price : 0,
    thumbnail: readString(data, 'thumbnail'),
    brand: readString(data, 'brand'),
    images: Array.isArray(images)
      ? images.filter((image): image is string => typeof image === 'string')
      : [],
    size: readSize(data['dimensions']),
  }
}

export async function getProduct(id: number): Promise<ApiResult<Product>> {
  const result = await apiGet(`/products/${String(id)}`)
  if (result.error) {
    return result
  }
  const product = parseProduct(result.data)
  return product === null ? UNEXPECTED_RESPONSE : { error: false, data: product }
}

function toSavedProduct(result: ApiResult<unknown>): ApiResult<SavedProduct> {
  if (result.error) {
    return result
  }
  const data = result.data
  return isRecord(data) && typeof data['id'] === 'number'
    ? { error: false, data: { id: data['id'] } }
    : UNEXPECTED_RESPONSE
}

export async function addProduct(data: FormData): Promise<ApiResult<SavedProduct>> {
  return toSavedProduct(await apiPost('/products/add', data))
}

// DummyJSON answers with the product plus isDeleted, but does not really remove it.
export async function deleteProduct(id: number): Promise<ApiResult<SavedProduct>> {
  return toSavedProduct(await apiDelete(`/products/${String(id)}`))
}

export async function updateProduct(id: number, data: FormData): Promise<ApiResult<SavedProduct>> {
  return toSavedProduct(await apiPut(`/products/${String(id)}`, data))
}

// Form values use the design's names; DummyJSON's own fields are title, category, description
// and price. Empty optional fields are left out.
export function buildProductFormData(values: ProductValues, images: Blob[]): FormData {
  const data = new FormData()
  data.append('title', values.name.trim())
  data.append('category', values.category)
  data.append('price', values.ratePerUnit.trim())
  const optional: Record<string, string> = {
    description: values.description.trim(),
    form: values.form,
    safety: values.safety,
    uom: values.uom,
    marketSellingPrice: values.marketSellingPrice.trim(),
    saleProfitMargin: values.saleProfitMargin.trim(),
    productType: values.productType.trim(),
    productSize: values.productSize.trim(),
    productVariant: values.productVariant.trim(),
    productColor: values.productColor.trim(),
  }
  for (const [key, value] of Object.entries(optional)) {
    if (value !== '') {
      data.append(key, value)
    }
  }
  data.append('ecoFriendly', String(values.ecoFriendly))
  data.append('handleWithCare', String(values.handleWithCare))
  // One "images" entry per file, in the order shown (the first is the main image).
  images.forEach((image, index) => {
    data.append(
      'images',
      image,
      image instanceof File ? image.name : `product-image-${String(index + 1)}`,
    )
  })
  return data
}

// Edit mode: DummyJSON only has some of the design's fields.
export function productToFormValues(product: Product): Partial<ProductValues> {
  return {
    name: product.title,
    category: product.category,
    description: product.description,
    ratePerUnit: product.price > 0 ? String(product.price) : '',
  }
}
