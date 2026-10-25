import type { DashboardSummary } from '../../src/domains/dashboard/domain/dashboard.types.ts'
import type { Db } from '../db/database.ts'
import { findRecentProducts, findSummaryCounts } from '../repositories/dashboard.repository.ts'

const RECENT_PRODUCTS_LIMIT = 5

export function getDashboardSummary(db: Db): DashboardSummary {
  const counts = findSummaryCounts(db)
  return {
    totalProducts: counts.totalProducts,
    activeProducts: counts.activeProducts,
    lowStockProducts: counts.lowStockProducts,
    inventoryValue: counts.inventoryValue,
    recentProducts: findRecentProducts(db, RECENT_PRODUCTS_LIMIT),
  }
}
