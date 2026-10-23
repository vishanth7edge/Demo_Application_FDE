import { useState } from 'react'
import { Provider } from 'react-redux'

import { AuthProvider } from './context/AuthProvider.tsx'
import { setupStore } from './store/store.ts'

import type { AppStore } from './store/store.ts'

export interface AppProvidersProps {
  // The app passes its saved-cart store; tests leave it out and get a fresh, empty one.
  store?: AppStore | undefined
  children: React.ReactNode
}

// Everything the pages need above the router: the Redux store (cart) and the logged-in user.
export function AppProviders({ store, children }: AppProvidersProps): React.JSX.Element {
  const [fallbackStore] = useState(setupStore)
  return (
    <Provider store={store ?? fallbackStore}>
      <AuthProvider>{children}</AuthProvider>
    </Provider>
  )
}
