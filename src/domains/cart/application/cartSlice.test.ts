import { describe, expect, it } from 'vitest'

import { setupStore } from '../../../store/store.ts'
import {
  addToCart,
  clearCart,
  decrementQuantity,
  removeFromCart,
  selectCartCount,
  selectCartItems,
  selectCartQuantity,
  selectCartTotal,
} from './cartSlice.ts'

const CHAIR = { id: 1, title: 'Chair', price: 49.99, thumbnail: '' }
const LAMP = { id: 2, title: 'Lamp', price: 0.1, thumbnail: '' }

describe('cart slice', () => {
  it('adds a product, then counts up instead of adding it twice', () => {
    const store = setupStore()
    store.dispatch(addToCart(CHAIR))
    store.dispatch(addToCart(CHAIR))
    store.dispatch(addToCart(LAMP))

    expect(selectCartItems(store.getState())).toEqual([
      { ...CHAIR, quantity: 2 },
      { ...LAMP, quantity: 1 },
    ])
    expect(selectCartCount(store.getState())).toBe(3)
    expect(selectCartQuantity(store.getState(), CHAIR.id)).toBe(2)
    expect(selectCartQuantity(store.getState(), 999)).toBe(0)
  })

  it('totals to the cent', () => {
    const store = setupStore()
    store.dispatch(addToCart(CHAIR))
    store.dispatch(addToCart(LAMP))
    store.dispatch(addToCart(LAMP))
    store.dispatch(addToCart(LAMP))

    expect(selectCartTotal(store.getState())).toBe(50.29)
  })

  it('stops at 99 of one product', () => {
    const store = setupStore({ cart: { items: [{ ...CHAIR, quantity: 99 }] } })
    store.dispatch(addToCart(CHAIR))
    expect(selectCartQuantity(store.getState(), CHAIR.id)).toBe(99)
  })

  it('removes a product when its quantity goes below one', () => {
    const store = setupStore({ cart: { items: [{ ...CHAIR, quantity: 2 }] } })
    store.dispatch(decrementQuantity(CHAIR.id))
    expect(selectCartQuantity(store.getState(), CHAIR.id)).toBe(1)
    store.dispatch(decrementQuantity(CHAIR.id))
    expect(selectCartItems(store.getState())).toEqual([])
  })

  it('removes one product or clears everything', () => {
    const store = setupStore({
      cart: {
        items: [
          { ...CHAIR, quantity: 1 },
          { ...LAMP, quantity: 3 },
        ],
      },
    })
    store.dispatch(removeFromCart(CHAIR.id))
    expect(selectCartItems(store.getState()).map((item) => item.id)).toEqual([LAMP.id])
    store.dispatch(clearCart())
    expect(selectCartCount(store.getState())).toBe(0)
  })
})
