import { useEffect, useId, useRef } from 'react'

import { CloseIcon } from './icons/UiIcons.tsx'
import { AlertCircleIcon, CheckCircleIcon } from './icons/ProductIcons.tsx'

export interface ModalProps {
  // success: green check ("Product Added Successfully"); warning: orange "!" (Delete, Attention).
  tone: 'success' | 'warning'
  title: string
  description: string
  // Called on Escape, on the backdrop and on the × (the × is only shown when `closeLabel` is set).
  onClose: () => void
  closeLabel?: string | undefined
  // The buttons, right-aligned. The first one gets focus when the modal opens.
  children: React.ReactNode
}

// Figma "Success Modal" / "Attention Modal" / "Delete": icon, title, text, two buttons.
export function Modal({
  tone,
  title,
  description,
  onClose,
  closeLabel,
  children,
}: ModalProps): React.JSX.Element {
  const titleId = useId()
  const descriptionId = useId()
  const actionsRef = useRef<HTMLDivElement>(null)
  // Latest onClose without re-running the effect (parents pass inline functions).
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    const previous = document.activeElement
    actionsRef.current?.querySelector('button')?.focus()
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        onCloseRef.current()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      // Give focus back to whatever opened the modal.
      if (previous instanceof HTMLElement) {
        previous.focus()
      }
    }
  }, [])

  const Icon = tone === 'success' ? CheckCircleIcon : AlertCircleIcon

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div aria-hidden="true" className="absolute inset-0 bg-on-surface/60" onClick={onClose} />
      <div
        role={tone === 'warning' ? 'alertdialog' : 'dialog'}
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="relative w-full max-w-108 rounded-xl bg-surface p-5 shadow-xl"
      >
        <div className="flex items-start justify-between">
          <Icon className={`size-8 ${tone === 'success' ? 'text-success' : 'text-warning'}`} />
          {closeLabel !== undefined && (
            <button
              type="button"
              aria-label={closeLabel}
              onClick={onClose}
              className="flex size-8 items-center justify-center rounded-full bg-sidebar-active hover:bg-sidebar focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
            >
              <CloseIcon className="size-5" />
            </button>
          )}
        </div>
        <h2 id={titleId} className="mt-4 font-poppins text-title-small font-semibold">
          {title}
        </h2>
        <p id={descriptionId} className="mt-2 text-body-small text-on-surface-muted">
          {description}
        </p>
        <div ref={actionsRef} className="mt-6 flex justify-end gap-3 [&>*]:min-w-30">
          {children}
        </div>
      </div>
    </div>
  )
}
