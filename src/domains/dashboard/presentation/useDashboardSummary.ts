import { useEffect, useState } from 'react'

import { fetchDashboardSummary } from '../application/index.ts'
import type { DashboardSummary } from '../application/index.ts'

export type DashboardState =
  | { status: 'loading' }
  | { status: 'ready'; summary: DashboardSummary }
  | { status: 'error'; message: string }

const LOADING: DashboardState = { status: 'loading' }

// Keeps the page usable if the summary can't be loaded.
const EMPTY_SUMMARY: DashboardSummary = {
  totalProducts: 0,
  activeProducts: 0,
  lowStockProducts: 0,
  inventoryValue: 0,
  recentProducts: [],
}

export function useDashboardSummary(): { state: DashboardState; reload: () => void } {
  const [reloadCount, setReloadCount] = useState(0)
  const [response, setResponse] = useState<{ key: number; state: DashboardState } | null>(null)

  useEffect(() => {
    let ignore = false
    void fetchDashboardSummary().then((result) => {
      if (ignore) {
        return
      }
      if (result.error) {
        console.error('[dashboard] Failed to load summary:', result)
        setResponse({ key: reloadCount, state: { status: 'ready', summary: EMPTY_SUMMARY } })
        return
      }
      setResponse({ key: reloadCount, state: { status: 'ready', summary: result.data } })
    })
    return () => {
      ignore = true
    }
  }, [reloadCount])

  return {
    state: response?.key === reloadCount ? response.state : LOADING,
    reload: () => {
      setReloadCount((count) => count + 1)
    },
  }
}
