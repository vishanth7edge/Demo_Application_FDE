import {
  DEFAULT_LIST_QUERY,
  hasFieldErrors,
  isProductCategory,
  isProductStatus,
  PAGE_SIZE_OPTIONS,
  validateProductInput,
} from '../../src/domains/products/domain/product.rules.ts'
import type {
  Product,
  ProductInput,
  ProductListQuery,
  ProductListResult,
} from '../../src/domains/products/domain/product.types.ts'
import type { Db } from '../db/database.ts'
import { HttpError, notFoundError, validationError } from '../lib/httpError.ts'
import type { FieldErrorDetail } from '../lib/httpError.ts'
import { asRecord, readNumber, readString } from '../lib/request.ts'
import { sanitizeText } from '../lib/sanitize.ts'
import {
  deleteProductById,
  findProductById,
  findProductIdBySku,
  findProducts,
  insertProduct,
  isSortableField,
  updateProductById,
} from '../repositories/product.repository.ts'
import type { ProductValues } from '../repositories/product.repository.ts'

type QueryValue = string | string[] | object | undefined

function queryString(query: Record<string, QueryValue>, key: string): string {
  const value = query[key]
  return typeof value === 'string' ? value : ''
}

function positiveInt(raw: string, fallback: number): number {
  if (raw === '') {
    return fallback
  }
  const value = Number(raw)
  return Number.isInteger(value) && value > 0 ? value : Number.NaN
}

export function parseListQuery(query: Record<string, QueryValue>): ProductListQuery {
  const details: FieldErrorDetail[] = []
  const category = queryString(query, 'category')
  const status = queryString(query, 'status')
  const sort = queryString(query, 'sort') || DEFAULT_LIST_QUERY.sort
  const order = queryString(query, 'order') || DEFAULT_LIST_QUERY.order
  const page = positiveInt(queryString(query, 'page'), 1)
  const pageSize = positiveInt(queryString(query, 'pageSize'), DEFAULT_LIST_QUERY.pageSize)

  if (category !== '' && !isProductCategory(category)) {
    details.push({ field: 'category', message: `Unknown category "${category}"` })
  }
  if (status !== '' && !isProductStatus(status)) {
    details.push({ field: 'status', message: `Unknown status "${status}"` })
  }
  if (!isSortableField(sort)) {
    details.push({ field: 'sort', message: `Sorting by "${sort}" is not supported` })
  }
  if (order !== 'asc' && order !== 'desc') {
    details.push({ field: 'order', message: 'Order must be "asc" or "desc"' })
  }
  if (Number.isNaN(page)) {
    details.push({ field: 'page', message: 'Page must be a positive whole number' })
  }
  if (!(PAGE_SIZE_OPTIONS as readonly number[]).includes(pageSize)) {
    details.push({
      field: 'pageSize',
      message: `Page size must be one of ${PAGE_SIZE_OPTIONS.join(', ')}`,
    })
  }
  if (details.length > 0) {
    throw new HttpError(400, 'INVALID_QUERY', 'The product list query is invalid.', details)
  }

  return {
    search: queryString(query, 'search').trim(),
    category: isProductCategory(category) ? category : '',
    status: isProductStatus(status) ? status : '',
    sort: isSortableField(sort) ? sort : DEFAULT_LIST_QUERY.sort,
    order: order === 'asc' ? 'asc' : 'desc',
    page,
    pageSize,
  }
}

export function listProducts(db: Db, query: ProductListQuery): ProductListResult {
  const { items, total } = findProducts(db, query)
  return { items, total, page: query.page, pageSize: query.pageSize }
}

export function getProduct(db: Db, id: number): Product {
  const product = findProductById(db, id)
  if (product === undefined) {
    throw notFoundError(`Product ${String(id)} was not found.`)
  }
  return product
}

function readProductInput(body: unknown): ProductInput {
  const record = asRecord(body)
  return {
    name: readString(record, 'name'),
    sku: readString(record, 'sku'),
    category: readString(record, 'category'),
    price: readNumber(record, 'price'),
    quantity: readNumber(record, 'quantity'),
    status: readString(record, 'status'),
  }
}

function normalizeSku(sku: string): string {
  return sku.trim().toUpperCase()
}

/** Validates the request body with the same rules the form uses, then maps it to DB values. */
function toProductValues(body: unknown): ProductValues {
  const input = readProductInput(body)
  const errors = validateProductInput(input)
  if (hasFieldErrors(errors) || input.price === null || input.quantity === null) {
    throw validationError(Object.entries(errors).map(([field, message]) => ({ field, message })))
  }
  return {
    name: sanitizeText(input.name),
    sku: input.sku,
    category: isProductCategory(input.category) ? input.category : 'Electronics',
    priceCents: Math.round(input.price * 100),
    quantity: input.quantity,
    status: isProductStatus(input.status) ? input.status : 'active',
  }
}

function skuTakenError(sku: string): HttpError {
  return new HttpError(409, 'SKU_TAKEN', `A product with SKU ${sku} already exists.`, [
    { field: 'sku', message: 'This SKU is already used by another product' },
  ])
}

export function createProduct(db: Db, body: unknown): Product {
  const values = toProductValues(body)
  values.sku = normalizeSku(values.sku)
  if (findProductIdBySku(db, values.sku) !== undefined) {
    throw skuTakenError(values.sku)
  }
  const id = insertProduct(db, values, new Date().toISOString())
  return getProduct(db, id)
}

export function updateProduct(db: Db, id: number, body: unknown): Product {
  getProduct(db, id)
  const values = toProductValues(body)
  const ownerId = findProductIdBySku(db, values.sku)
  if (ownerId !== undefined && ownerId !== id) {
    throw skuTakenError(values.sku)
  }
  updateProductById(db, id, values, new Date().toISOString())
  return getProduct(db, id)
}

export function deleteProduct(db: Db, id: number): void {
  if (!deleteProductById(db, id)) {
    throw notFoundError(`Product ${String(id)} was not found.`)
  }
}
