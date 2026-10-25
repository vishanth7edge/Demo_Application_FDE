import type { RecentProduct } from '../../src/domains/dashboard/domain/dashboard.types.ts'
import { LOW_STOCK_THRESHOLD } from '../../src/domains/products/domain/product.rules.ts'
import type { Db } from '../db/database.ts'

export interface SummaryCounts {
  totalProducts: number
  activeProducts: number
  lowStockProducts: number
  inventoryValue: number
}

export function findSummaryCounts(db: Db): SummaryCounts {
  const row = db
    .prepare<[number], SummaryCounts>(
      `SELECT
         COUNT(*) AS totalProducts,
         COALESCE(SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END), 0) AS activeProducts,
         COALESCE(SUM(CASE WHEN quantity < ? THEN 1 ELSE 0 END), 0) AS lowStockProducts,
         COALESCE(SUM(price_cents / 100 * quantity), 0) AS inventoryValue
       FROM products`,
    )
    .get(LOW_STOCK_THRESHOLD)
  return row ?? { totalProducts: 0, activeProducts: 0, lowStockProducts: 0, inventoryValue: 0 }
}

export function findRecentProducts(db: Db, limit: number): RecentProduct[] {
  return db
    .prepare<[number], RecentProduct>(
      `SELECT id, name, sku, category, price_cents / 100.0 AS price, quantity, created_at AS createdAt
       FROM products
       ORDER BY created_at DESC, id DESC
       LIMIT ?`,
    )
    .all(limit)
}
