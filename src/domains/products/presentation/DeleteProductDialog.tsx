import { ConfirmDialog } from '../../../shared/ui/ConfirmDialog.tsx'
import type { ProductDelete } from './useProductDelete.ts'

export interface DeleteProductDialogProps {
  /** State and actions from useProductDelete(). */
  deletion: ProductDelete
}

export function DeleteProductDialog({ deletion }: DeleteProductDialogProps): React.JSX.Element {
  const { target: product, busy, confirm, cancel } = deletion
  return (
    <ConfirmDialog
      open={product !== null}
      title="Delete product?"
      confirmLabel="Delete product"
      busyLabel="Deleting…"
      busy={busy}
      onConfirm={confirm}
      onCancel={cancel}
    >
      {product === null ? null : (
        <p>
          <span className="font-medium whitespace-nowrap text-slate-900">{product.name}</span>{' '}
          <span className="whitespace-nowrap">(SKU {product.sku})</span> will be permanently removed
          from the catalogue. This can't be undone.
        </p>
      )}
    </ConfirmDialog>
  )
}
