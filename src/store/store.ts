import { combineReducers, configureStore } from '@reduxjs/toolkit'

import { cartReducer } from '../domains/cart/application/index.ts'
import { loadCart, saveCart } from '../domains/cart/infrastructure/index.ts'

// One reducer per slice; the key ("cart") is where its state lives: state.cart.items.
const rootReducer = combineReducers({ cart: cartReducer })

export type RootState = ReturnType<typeof rootReducer>

// A fresh store. Tests call this directly so each test starts clean. Its type (with the typed
// dispatch) is inferred from configureStore, as Redux Toolkit recommends, so it has no annotation.
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type -- see above
export function setupStore(preloadedState?: Partial<RootState>) {
  return configureStore({
    reducer: rootReducer,
    ...(preloadedState === undefined ? {} : { preloadedState }),
  })
}

export type AppStore = ReturnType<typeof setupStore>
export type AppDispatch = AppStore['dispatch']

// The app's store: starts from the saved cart and saves it again whenever it changes.
export function createPersistedStore(): AppStore {
  const store = setupStore({ cart: loadCart() })
  let saved = store.getState().cart
  store.subscribe(() => {
    const cart = store.getState().cart
    if (cart !== saved) {
      saved = cart
      saveCart(cart)
    }
  })
  return store
}
