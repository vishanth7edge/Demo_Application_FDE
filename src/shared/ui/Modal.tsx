import { useEffect, useId, useRef } from 'react'
import type { KeyboardEvent, ReactNode, RefObject } from 'react'
import { createPortal } from 'react-dom'

export interface ModalProps {
  open: boolean
  title: string
  onClose: () => void
  /** While true, Escape and backdrop clicks are ignored (e.g. a request is in flight). */
  busy?: boolean
  /** Element to focus when the dialog opens; defaults to the first focusable element. */
  initialFocusRef?: RefObject<HTMLElement | null>
  children?: ReactNode
  footer?: ReactNode
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

function focusableIn(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE))
}

/** Accessible dialog: focus moves in, Tab is trapped, Escape closes, focus returns on close. */
export function Modal({
  open,
  title,
  onClose,
  busy = false,
  initialFocusRef,
  children,
  footer,
}: ModalProps): React.JSX.Element | null {
  const panelRef = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const bodyId = useId()

  useEffect(() => {
    if (!open) {
      return undefined
    }
    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null
    const panel = panelRef.current
    const target =
      initialFocusRef?.current ?? (panel === null ? null : (focusableIn(panel)[0] ?? panel))
    target?.focus()
    document.body.classList.add('overflow-hidden')
    return () => {
      document.body.classList.remove('overflow-hidden')
      previouslyFocused?.focus()
    }
  }, [open, initialFocusRef])

  if (!open) {
    return null
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.key === 'Escape' && !busy) {
      event.stopPropagation()
      onClose()
      return
    }
    const panel = panelRef.current
    if (event.key !== 'Tab' || panel === null) {
      return
    }
    const items = focusableIn(panel)
    const first = items[0]
    const last = items[items.length - 1]
    if (first === undefined || last === undefined) {
      event.preventDefault()
      return
    }
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto" onKeyDown={handleKeyDown}>
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-[1px]"
        aria-hidden="true"
        onClick={busy ? undefined : onClose}
      />
      <div className="flex min-h-full items-end justify-center p-4 sm:items-center">
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={bodyId}
          tabIndex={-1}
          className="relative w-full max-w-md rounded-xl bg-surface shadow-xl focus:outline-none"
        >
          <div className="px-6 pt-6">
            <h2 id={titleId} className="text-lg font-semibold text-slate-900">
              {title}
            </h2>
            <div id={bodyId} className="mt-2 text-sm text-slate-600">
              {children}
            </div>
          </div>
          {footer === undefined ? null : (
            <div className="mt-6 flex flex-col-reverse gap-2 rounded-b-xl border-t border-line bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
