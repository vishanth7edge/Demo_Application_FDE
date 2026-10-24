import { useEffect, useId, useRef } from 'react'

import { useEscapeKey } from './useEscapeKey.ts'
import { CloseIcon, SuccessIcon, WarningIcon } from './Icons.tsx'

export interface AlertDialogProps {
  tone: 'warning' | 'success'
  title: string
  description: string
  /** The dialog's buttons, rendered right-aligned. */
  actions: React.ReactNode
  onClose: () => void
}

export default function AlertDialog({
  tone,
  title,
  description,
  actions,
  onClose,
}: AlertDialogProps): React.JSX.Element {
  const titleId = useId()
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    closeRef.current?.focus()
  }, [])
  useEscapeKey(true, onClose)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-scrim/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative flex w-full max-w-xl flex-col gap-3 rounded-2xl bg-surface p-5 shadow-lg"
      >
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 rounded-full bg-surface-container p-2 text-on-surface focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
        >
          <CloseIcon />
        </button>
        <span className={tone === 'success' ? 'text-secondary' : 'text-error'}>
          {tone === 'success' ? <SuccessIcon /> : <WarningIcon />}
        </span>
        <h2 id={titleId} className="text-title-medium text-on-surface">
          {title}
        </h2>
        <p className="text-body-medium text-on-surface-variant">{description}</p>
        <div className="mt-2 flex flex-wrap justify-end gap-3">{actions}</div>
      </div>
    </div>
  )
}
