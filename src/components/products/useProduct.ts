import { useEffect, useState } from 'react'

import type { ApiResult } from '../../shared/apiClient.ts'
import { getProduct, type Product } from '../../services/productService.ts'

interface Settled {
  id: number
  result: ApiResult<Product>
}

/** The product with this id, or `null` while it is loading. */
export function useProduct(id: number): ApiResult<Product> | null {
  const [settled, setSettled] = useState<Settled | null>(null)

  useEffect(() => {
    let ignore = false
    void getProduct(id).then((result) => {
      if (!ignore) {
        setSettled({ id, result })
      }
    })
    return () => {
      ignore = true
    }
  }, [id])

  return settled?.id === id ? settled.result : null
}
