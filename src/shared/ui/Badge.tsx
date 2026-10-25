import type { ReactNode } from 'react'

export type BadgeTone = 'success' | 'warning' | 'danger' | 'neutral' | 'info'

export interface BadgeProps {
  tone: BadgeTone
  children: ReactNode
}

const TONE_CLASSES: Record<BadgeTone, { badge: string; dot: string }> = {
  success: { badge: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20', dot: 'bg-emerald-500' },
  warning: { badge: 'bg-amber-50 text-amber-800 ring-amber-600/25', dot: 'bg-amber-500' },
  danger: { badge: 'bg-rose-50 text-rose-700 ring-rose-600/20', dot: 'bg-rose-500' },
  neutral: { badge: 'bg-slate-100 text-slate-600 ring-slate-500/20', dot: 'bg-slate-400' },
  info: { badge: 'bg-brand-soft text-brand ring-brand/20', dot: 'bg-brand' },
}

export function Badge({ tone, children }: BadgeProps): React.JSX.Element {
  const classes = TONE_CLASSES[tone]
  return (
    <span
      data-tone={tone}
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset ${classes.badge}`}
    >
      <span className={`size-1.5 rounded-full ${classes.dot}`} aria-hidden="true" />
      {children}
    </span>
  )
}
