// Presentation reads the cart through this layer, including its types and limits.
export {
  addToCart,
  cartReducer,
  clearCart,
  decrementQuantity,
  removeFromCart,
  selectCartCount,
  selectCartItems,
  selectCartQuantity,
  selectCartTotal,
} from './cartSlice.ts'
export { EMPTY_CART, MAX_CART_QUANTITY } from '../domain/index.ts'
export type { CartItem, CartProduct, CartState } from '../domain/index.ts'
