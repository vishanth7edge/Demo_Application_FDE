import { useState } from 'react'

import { deleteProduct } from '../services/productService.ts'

import type { Product } from '../services/productService.ts'

export interface ProductDelete {
  // The product waiting for confirmation in the Delete modal.
  target: Product | null
  ask: (product: Product) => void
  cancel: () => void
  confirm: () => void
  isDeleting: boolean
  error: string | null
  // Status line after a delete, e.g. "“Chair” was deleted."
  notice: string | null
}

export function useProductDelete(onDeleted: (id: number) => void): ProductDelete {
  const [target, setTarget] = useState<Product | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const run = async (product: Product): Promise<void> => {
    setIsDeleting(true)
    setError(null)
    const result = await deleteProduct(product.id)
    setIsDeleting(false)
    if (result.error) {
      setError(result.message)
      return
    }
    onDeleted(product.id)
    setTarget(null)
    setNotice(`“${product.title}” was deleted.`)
  }

  return {
    target,
    ask: (product) => {
      setError(null)
      setTarget(product)
    },
    cancel: () => {
      if (!isDeleting) {
        setTarget(null)
      }
    },
    confirm: () => {
      if (target !== null) {
        void run(target)
      }
    },
    isDeleting,
    error,
    notice,
  }
}
