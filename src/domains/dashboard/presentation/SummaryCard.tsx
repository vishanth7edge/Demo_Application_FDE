import type { ReactNode } from 'react'

export type SummaryCardTone = 'brand' | 'success' | 'warning' | 'info'

export interface SummaryCardProps {
  label: string
  value: string
  caption: string
  icon: ReactNode
  tone: SummaryCardTone
}

const ICON_TONES: Record<SummaryCardTone, string> = {
  brand: 'bg-brand-soft text-brand',
  success: 'bg-emerald-50 text-emerald-600',
  warning: 'bg-amber-50 text-amber-600',
  info: 'bg-sky-50 text-sky-600',
}

export function SummaryCard({
  label,
  value,
  caption,
  icon,
  tone,
}: SummaryCardProps): React.JSX.Element {
  return (
    <div className="rounded-xl border border-line bg-surface p-5 shadow-xs">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 tabular-nums">
            {value}
          </p>
        </div>
        <span
          className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${ICON_TONES[tone]}`}
        >
          {icon}
        </span>
      </div>
      <p className="mt-3 text-xs text-slate-500">{caption}</p>
    </div>
  )
}
