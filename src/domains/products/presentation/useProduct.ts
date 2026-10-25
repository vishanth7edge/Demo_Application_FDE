import { useEffect, useState } from 'react'

import { fetchProduct } from '../application/index.ts'
import type { Product } from '../application/index.ts'

export type ProductState =
  | { status: 'loading' }
  | { status: 'ready'; product: Product }
  | { status: 'not-found' }
  | { status: 'error'; message: string }

const LOADING: ProductState = { status: 'loading' }

export function useProduct(id: number): { state: ProductState; reload: () => void } {
  const [reloadCount, setReloadCount] = useState(0)
  const [response, setResponse] = useState<{ key: string; state: ProductState } | null>(null)
  const key = `${String(id)}#${String(reloadCount)}`

  useEffect(() => {
    let ignore = false
    void fetchProduct(id).then((result) => {
      if (ignore) {
        return
      }
      if (result.error) {
        if (result.status >= 500 || result.status === 0) {
          setResponse({ key, state: { status: 'error', message: result.message } })
        }
        return
      }
      setResponse({ key, state: { status: 'ready', product: result.data } })
    })
    return () => {
      ignore = true
    }
  }, [id, key])

  return {
    state: response?.key === key ? response.state : LOADING,
    reload: () => {
      setReloadCount((count) => count + 1)
    },
  }
}
