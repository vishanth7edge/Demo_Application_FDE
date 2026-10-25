import { useRef } from 'react'
import type { ReactNode } from 'react'

import { Button } from './Button.tsx'
import { Modal } from './Modal.tsx'

export interface ConfirmDialogProps {
  open: boolean
  title: string
  children: ReactNode
  confirmLabel: string
  busyLabel?: string
  tone?: 'danger' | 'primary'
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
}

/** Confirmation with the safe choice (Cancel) focused first. */
export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  busyLabel,
  tone = 'danger',
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps): React.JSX.Element {
  const cancelRef = useRef<HTMLButtonElement>(null)
  return (
    <Modal
      open={open}
      title={title}
      onClose={onCancel}
      busy={busy}
      initialFocusRef={cancelRef}
      footer={
        <>
          <Button ref={cancelRef} variant="secondary" disabled={busy} onClick={onCancel}>
            Cancel
          </Button>
          <Button variant={tone} loading={busy} onClick={onConfirm}>
            {busy ? (busyLabel ?? confirmLabel) : confirmLabel}
          </Button>
        </>
      }
    >
      {children}
    </Modal>
  )
}
