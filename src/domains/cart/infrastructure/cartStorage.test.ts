import { beforeEach, describe, expect, it } from 'vitest'

import { loadCart } from './cartStorage.ts'

beforeEach(() => {
  localStorage.clear()
})

describe('cart storage', () => {
  it('starts empty when nothing or something broken is saved', () => {
    expect(loadCart()).toEqual({ items: [] })
    localStorage.setItem('cart', '{not json')
    expect(loadCart()).toEqual({ items: [] })
  })

  it('drops malformed items', () => {
    localStorage.setItem(
      'cart',
      JSON.stringify({
        items: [
          { id: 1, title: 'Chair', price: 5, thumbnail: '', quantity: 2 },
          { id: 'x', title: 'Bad' },
          { id: 3, title: 'Zero', price: 1, thumbnail: '', quantity: 0 },
        ],
      }),
    )
    expect(loadCart().items.map((item) => item.id)).toEqual([1])
  })
})
