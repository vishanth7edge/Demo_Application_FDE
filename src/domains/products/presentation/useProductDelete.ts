import { useRef, useState } from 'react'

import { deleteProduct } from '../application/index.ts'
import type { Product } from '../application/index.ts'
import { useToast } from '../../../shared/feedback/useToast.ts'

export interface ProductDelete {
  /** The product shown in the confirmation dialog, or null when it is closed. */
  target: Product | null
  busy: boolean
  requestDelete: (product: Product) => void
  cancel: () => void
  confirm: () => void
}

/** Confirmation-dialog flow for deleting a product. `onDeleted` runs after a successful delete. */
export function useProductDelete(onDeleted: (product: Product) => void): ProductDelete {
  const { notify } = useToast()
  const [target, setTarget] = useState<Product | null>(null)
  const [busy, setBusy] = useState(false)
  // The id the dialog was opened for, kept stable while a delete request is in flight.
  const pendingId = useRef<number | null>(null)

  const run = async (product: Product): Promise<void> => {
    setBusy(true)
    const result = await deleteProduct(pendingId.current ?? product.id)
    pendingId.current = null
    setBusy(false)
    setTarget(null)
    if (result.error) {
      notify(result.message, 'error')
      return
    }
    onDeleted(product)
  }

  return {
    target,
    busy,
    requestDelete: (product) => {
      pendingId.current ??= product.id
      setTarget(product)
    },
    cancel: () => {
      if (!busy) {
        setTarget(null)
      }
    },
    confirm: () => {
      if (target !== null && !busy) {
        void run(target)
      }
    },
  }
}
