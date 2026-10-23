import { describe, expect, it } from 'vitest'

import { formatPrice, pageRangeLabel } from './productFormat.ts'

describe('formatPrice', () => {
  it.each([
    [1199, '$1,199'],
    [9.99, '$9.99'],
    [0, '$0'],
  ])('%d → %s', (price, label) => {
    expect(formatPrice(price)).toBe(label)
  })
})

describe('pageRangeLabel', () => {
  it.each([
    [1, 10, 150, '1–10 of 150'],
    [15, 10, 150, '141–150 of 150'],
    [2, 10, 14, '11–14 of 14'],
    [1, 10, 0, '0 of 0'],
  ])('page %d, size %d, total %d → %s', (page, size, total, label) => {
    expect(pageRangeLabel(page, size, total)).toBe(label)
  })
})
