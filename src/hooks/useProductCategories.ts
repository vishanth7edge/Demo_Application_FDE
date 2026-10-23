import { useEffect, useState } from 'react'

import { listCategories } from '../services/productListService.ts'

export type CategoriesLoad =
  | { status: 'idle' | 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; categories: string[] }

// Loads the category list the first time `enabled` is true (the filter panel opens).
export function useProductCategories(enabled: boolean): CategoriesLoad {
  const [state, setState] = useState<CategoriesLoad>({ status: 'idle' })
  const started = state.status !== 'idle'

  useEffect(() => {
    if (!enabled || started) {
      return
    }
    let cancelled = false
    void listCategories().then((result) => {
      if (!cancelled) {
        setState(
          result.error
            ? { status: 'error', message: result.message }
            : { status: 'ready', categories: result.data },
        )
      }
    })
    return () => {
      cancelled = true
    }
  }, [enabled, started])

  return enabled && state.status === 'idle' ? { status: 'loading' } : state
}
