// Cart types and limits. Pure data: imports nothing.

export const MAX_CART_QUANTITY = 99

export interface CartItem {
  id: number
  title: string
  price: number
  thumbnail: string
  quantity: number
}

// What a page passes to addToCart: a product without a quantity.
export type CartProduct = Omit<CartItem, 'quantity'>

export interface CartState {
  items: CartItem[]
}

export const EMPTY_CART: CartState = { items: [] }
