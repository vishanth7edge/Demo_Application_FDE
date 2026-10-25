import { apiGet } from '../../../shared/api/apiClient.ts'
import type { ApiResult } from '../../../shared/api/apiClient.ts'
import type { DashboardSummary } from '../domain/dashboard.types.ts'

export function fetchDashboardSummary(): Promise<ApiResult<DashboardSummary>> {
  return apiGet<DashboardSummary>('/api/dashboard/summary')
}

/** Share of the catalogue that is active, as a whole percentage. */
export function getActiveShare(
  summary: Pick<DashboardSummary, 'activeProducts' | 'totalProducts'>,
): number {
  return summary.totalProducts === 0
    ? 0
    : Math.round((summary.activeProducts / summary.totalProducts) * 100)
}

export function getFirstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? fullName
}
