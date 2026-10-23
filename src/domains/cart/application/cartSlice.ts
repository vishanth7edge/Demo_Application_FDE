import { createSlice } from '@reduxjs/toolkit'

import { EMPTY_CART, MAX_CART_QUANTITY } from '../domain/cart.ts'

import type { PayloadAction } from '@reduxjs/toolkit'
import type { CartProduct } from '../domain/cart.ts'

// Redux Toolkit slice: the state shape, the reducers that change it (written as "mutations" —
// Immer turns them into immutable updates) and the selectors that read it, all in one place.

const cartSlice = createSlice({
  name: 'cart',
  initialState: EMPTY_CART,
  reducers: {
    // Adds one; a product already in the cart just goes up by one.
    addToCart(state, action: PayloadAction<CartProduct>) {
      const item = state.items.find((entry) => entry.id === action.payload.id)
      if (item === undefined) {
        state.items.push({ ...action.payload, quantity: 1 })
      } else {
        item.quantity = Math.min(item.quantity + 1, MAX_CART_QUANTITY)
      }
      
    },
    // Takes one away; at zero the product leaves the cart.
    decrementQuantity(state, action: PayloadAction<number>) {
      const item = state.items.find((entry) => entry.id === action.payload)
      if (item === undefined) {
        return
      }
      if (item.quantity <= 1) {
        state.items = state.items.filter((entry) => entry.id !== action.payload)
      } else {
        item.quantity -= 1
      }
    },
    removeFromCart(state, action: PayloadAction<number>) {
      state.items = state.items.filter((entry) => entry.id !== action.payload)
    },
    clearCart() {
      return EMPTY_CART
    },
  },
  selectors: {
    selectCartItems: (state) => state.items,
    // Total pieces, for the header badge (2 chairs + 1 lamp = 3).
    selectCartCount: (state) => state.items.reduce((sum, item) => sum + item.quantity, 0),
    // Rounded to cents so 0.1 + 0.2 shows as 0.3.
    selectCartTotal: (state) =>
      Math.round(state.items.reduce((sum, item) => sum + item.price * item.quantity, 0) * 100) /
      100,
    selectCartQuantity: (state, id: number) =>
      state.items.find((item) => item.id === id)?.quantity ?? 0,
  },
})

export const { addToCart, decrementQuantity, removeFromCart, clearCart } = cartSlice.actions
export const { selectCartItems, selectCartCount, selectCartTotal, selectCartQuantity } =
  cartSlice.selectors
export const cartReducer = cartSlice.reducer
