const PRICE = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
})

// "$1,199" / "$9.99", as on the Figma product cards.
export function formatPrice(price: number): string {
  return PRICE.format(price).replace(/\.00$/, '')
}

// "1–10 of 194"; "0 of 0" when empty.
export function pageRangeLabel(page: number, pageSize: number, total: number): string {
  if (total === 0) {
    return '0 of 0'
  }
  const first = (page - 1) * pageSize + 1
  const last = Math.min(page * pageSize, total)
  return `${String(first)}–${String(last)} of ${String(total)}`
}
