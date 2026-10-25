import type { ReactNode } from 'react'

import { IconAlert, IconCheck, IconWarning } from './StatusIcons.tsx'

export type AlertTone = 'error' | 'success' | 'info' | 'warning'

export interface AlertProps {
  tone: AlertTone
  title?: string
  children?: ReactNode
  action?: ReactNode
}

const TONES: Record<AlertTone, { box: string; icon: React.JSX.Element }> = {
  error: {
    box: 'border-rose-200 bg-rose-50 text-rose-800',
    icon: <IconAlert className="size-5 text-rose-500" />,
  },
  success: {
    box: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    icon: <IconCheck className="size-5 text-emerald-500" />,
  },
  info: {
    box: 'border-indigo-200 bg-brand-soft text-indigo-900',
    icon: <IconAlert className="size-5 text-brand" />,
  },
  warning: {
    box: 'border-amber-200 bg-amber-50 text-amber-900',
    icon: <IconWarning className="size-5 text-amber-500" />,
  },
}

export function Alert({ tone, title, children, action }: AlertProps): React.JSX.Element {
  const { box, icon } = TONES[tone]
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={`flex items-start gap-3 rounded-lg border px-4 py-3 text-sm ${box}`}
    >
      <span className="mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0 flex-1">
        {title === undefined ? null : <p className="font-semibold">{title}</p>}
        {children === undefined ? null : (
          <div className={title === undefined ? '' : 'mt-0.5'}>{children}</div>
        )}
      </div>
      {action === undefined ? null : <div className="shrink-0">{action}</div>}
    </div>
  )
}
