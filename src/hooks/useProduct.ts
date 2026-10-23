import { useEffect, useState } from 'react'

import { getProduct } from '../services/productService.ts'

import type { Product } from '../services/productService.ts'

export type ProductLoad =
  | { status: 'loading' }
  | { status: 'not-found' }
  | { status: 'error'; message: string }
  | { status: 'ready'; product: Product }

// Loads one product. Give the calling component `key={id}` so a new id starts from "loading".
export function useProduct(id: number): ProductLoad {
  const [state, setState] = useState<ProductLoad>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    void getProduct(id).then((result) => {
      if (cancelled) {
        return
      }
      if (!result.error) {
        setState({ status: 'ready', product: result.data })
      } else if (result.status === 404) {
        setState({ status: 'not-found' })
      } else {
        setState({ status: 'error', message: result.message })
      }
    })
    return () => {
      cancelled = true
    }
  }, [id])

  return state
}
