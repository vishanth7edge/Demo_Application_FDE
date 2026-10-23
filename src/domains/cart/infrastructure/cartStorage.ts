import { EMPTY_CART } from '../domain/cart.ts'

import type { CartItem, CartState } from '../domain/cart.ts'

// Keeps the cart across page reloads. Anything unreadable starts an empty cart.
const CART_KEY = 'cart'

function isCartItem(value: unknown): value is CartItem {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const item = value as Record<string, unknown>
  return (
    typeof item['id'] === 'number' &&
    typeof item['title'] === 'string' &&
    typeof item['price'] === 'number' &&
    typeof item['thumbnail'] === 'string' &&
    typeof item['quantity'] === 'number' &&
    item['quantity'] > 0
  )
}

export function loadCart(): CartState {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(CART_KEY) ?? 'null')
    const items =
      typeof parsed === 'object' && parsed !== null && 'items' in parsed ? parsed.items : null
    return Array.isArray(items) ? { items: items.filter(isCartItem) } : EMPTY_CART
  } catch {
    return EMPTY_CART
  }
}

export function saveCart(cart: CartState): void {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cart))
  } catch {
    // Storage full or blocked: the cart still works for this visit.
  }
}
