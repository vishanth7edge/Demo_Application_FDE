import { beforeEach, describe, expect, it } from 'vitest'

import { addToCart } from '../domains/cart/index.ts'
import { createPersistedStore } from './store.ts'

beforeEach(() => {
  localStorage.clear()
})

describe('createPersistedStore', () => {
  it('saves every change and restores it in a new store (page reload)', () => {
    const store = createPersistedStore()
    store.dispatch(addToCart({ id: 7, title: 'Desk', price: 120, thumbnail: '' }))

    expect(createPersistedStore().getState().cart.items).toEqual([
      { id: 7, title: 'Desk', price: 120, thumbnail: '', quantity: 1 },
    ])
  })
})
