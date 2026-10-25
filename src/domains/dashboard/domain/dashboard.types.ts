// Pure dashboard types, shared with the API server.

export interface RecentProduct {
  id: number
  name: string
  sku: string
  category: string
  price: number
  quantity: number
  createdAt: string
}

export interface DashboardSummary {
  totalProducts: number
  activeProducts: number
  lowStockProducts: number
  inventoryValue: number
  recentProducts: RecentProduct[]
}
