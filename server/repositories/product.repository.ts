import type {
  Product,
  ProductCategory,
  ProductListQuery,
  ProductSortField,
  ProductStatus,
} from '../../src/domains/products/domain/product.types.ts'
import type { Db } from '../db/database.ts'

export interface ProductValues {
  name: string
  sku: string
  category: ProductCategory
  priceCents: number
  quantity: number
  status: ProductStatus
}

interface ProductRow {
  id: number
  name: string
  sku: string
  category: string
  price_cents: number
  quantity: number
  status: string
  created_at: string
  updated_at: string
}

/** Whitelisted ORDER BY columns. Never interpolate anything else into SQL. */
const SORT_COLUMNS: Readonly<Record<string, string>> = {
  name: 'name',
  category: 'category',
  price: 'price_cents',
  quantity: 'quantity',
  createdAt: 'created_at',
}

const SELECT_COLUMNS =
  'id, name, sku, category, price_cents, quantity, status, created_at, updated_at'

function toProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    sku: row.sku,
    category: row.category as ProductCategory,
    price: row.price_cents / 100,
    quantity: row.quantity,
    status: row.status as ProductStatus,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (match) => `\\${match}`)
}

export function isSortableField(value: string): value is ProductSortField {
  return Object.hasOwn(SORT_COLUMNS, value)
}

export function findProducts(db: Db, query: ProductListQuery): { items: Product[]; total: number } {
  const conditions: string[] = []
  const params: (string | number)[] = []

  if (query.search !== '') {
    conditions.push("(name LIKE ? ESCAPE '\\' OR sku = ?)")
    params.push(`%${escapeLike(query.search)}%`, query.search)
  }

  // Dropdown filters: match products in the selected category or with the selected status.
  const filters: string[] = []
  if (query.category !== '') {
    filters.push('category = ?')
    params.push(query.category)
  }
  if (query.status !== '') {
    filters.push('status = ?')
    params.push(query.status)
  }
  if (filters.length > 0) {
    conditions.push(`(${filters.join(' OR ')})`)
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  const column = SORT_COLUMNS[query.sort] ?? 'created_at'
  const direction = query.order === 'asc' ? 'ASC' : 'DESC'
  const offset = (query.page - 1) * query.pageSize

  const total = db
    .prepare<(string | number)[], { total: number }>(
      `SELECT COUNT(*) AS total FROM products ${where}`,
    )
    .get(...params)?.total
  const rows = db
    .prepare<(string | number)[], ProductRow>(
      `SELECT ${SELECT_COLUMNS} FROM products ${where}
       ORDER BY lower(${column}) ${direction}, id ${direction}
       LIMIT ? OFFSET ?`,
    )
    .all(...params, query.pageSize, offset)

  return { items: rows.map(toProduct), total: total ?? 0 }
}

export function findProductById(db: Db, id: number): Product | undefined {
  const row = db
    .prepare<[number], ProductRow>(`SELECT ${SELECT_COLUMNS} FROM products WHERE id = ?`)
    .get(id)
  return row === undefined ? undefined : toProduct(row)
}

export function findProductIdBySku(db: Db, sku: string): number | undefined {
  return db.prepare<[string], { id: number }>('SELECT id FROM products WHERE sku = ?').get(sku)?.id
}

export function insertProduct(db: Db, values: ProductValues, now: string): number {
  const result = db
    .prepare(
      `INSERT INTO products (name, sku, category, price_cents, quantity, status, created_at, updated_at)
       VALUES (@name, @sku, @category, @priceCents, @quantity, @status, @now, @now)`,
    )
    .run({ ...values, now })
  return Number(result.lastInsertRowid)
}

export function updateProductById(db: Db, id: number, values: ProductValues, now: string): void {
  db.prepare(
    `UPDATE products
     SET name = @name, sku = @sku, category = @category, price_cents = @priceCents,
         quantity = @quantity, updated_at = @now
     WHERE id = @id`,
  ).run({ ...values, id, now })
}

export function deleteProductById(db: Db, id: number): boolean {
  return db.prepare('DELETE FROM products WHERE id = ?').run(id).changes > 0
}
