import { useCallback, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'

import { IconX } from '../ui/Icons.tsx'
import { IconAlert, IconCheck } from '../ui/StatusIcons.tsx'
import { ToastContext } from './ToastContext.ts'
import type { ToastApi, ToastTone } from './ToastContext.ts'

interface Toast {
  id: number
  message: string
  tone: ToastTone
}

export interface ToastProviderProps {
  children: ReactNode
}

const AUTO_DISMISS_MS = 5000

const TONE_CLASSES: Record<ToastTone, string> = {
  success: 'text-emerald-500',
  error: 'text-rose-500',
  info: 'text-brand',
}

export function ToastProvider({ children }: ToastProviderProps): React.JSX.Element {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(1)

  const dismiss = useCallback((id: number): void => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const notify = useCallback(
    (message: string, tone: ToastTone = 'success'): void => {
      const id = nextId.current
      nextId.current += 1
      setToasts((current) => [...current, { id, message, tone }])
      window.setTimeout(() => {
        dismiss(id)
      }, AUTO_DISMISS_MS)
    },
    [dismiss],
  )

  const api = useMemo<ToastApi>(() => ({ notify }), [notify])

  return (
    <ToastContext value={api}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 top-4 z-[60] flex flex-col items-end gap-2 sm:inset-x-auto sm:right-4 sm:w-96"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role={toast.tone === 'error' ? 'alert' : 'status'}
            data-tone={toast.tone}
            className="pointer-events-auto flex w-full animate-toast-in items-start gap-3 rounded-lg border border-line bg-surface px-4 py-3 text-sm text-slate-700 shadow-lg"
          >
            <span className={`mt-0.5 shrink-0 ${TONE_CLASSES[toast.tone]}`}>
              {toast.tone === 'success' ? <IconCheck /> : <IconAlert />}
            </span>
            <p className="min-w-0 flex-1 break-words">{toast.message}</p>
            <button
              type="button"
              aria-label="Dismiss notification"
              onClick={() => {
                dismiss(toast.id)
              }}
              className="-m-1 rounded p-1 text-slate-400 hover:text-slate-600 focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
            >
              <IconX className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext>
  )
}
