import { getProductStockLevel, getStatusLabel } from '../application/index.ts'
import type { ProductStatus, StockLevel } from '../application/index.ts'
import { Badge } from '../../../shared/ui/Badge.tsx'
import type { BadgeTone } from '../../../shared/ui/Badge.tsx'

const STATUS_TONES: Record<ProductStatus, BadgeTone> = {
  active: 'success',
  inactive: 'neutral',
  discontinued: 'success',
}

export interface StatusBadgeProps {
  status: ProductStatus
}

export function StatusBadge({ status }: StatusBadgeProps): React.JSX.Element {
  return <Badge tone={STATUS_TONES[status]}>{getStatusLabel(status)}</Badge>
}

const STOCK_BADGES: Record<Exclude<StockLevel, 'in'>, { tone: BadgeTone; label: string }> = {
  out: { tone: 'danger', label: 'Out of stock' },
  low: { tone: 'warning', label: 'Low stock' },
}

export interface StockBadgeProps {
  quantity: number
}

/** Nothing for healthy stock; a warning badge for low or no stock. */
export function StockBadge({ quantity }: StockBadgeProps): React.JSX.Element | null {
  const level = getProductStockLevel({ quantity })
  if (level === 'in') {
    return null
  }
  const badge = STOCK_BADGES[level]
  return <Badge tone={badge.tone}>{badge.label}</Badge>
}
