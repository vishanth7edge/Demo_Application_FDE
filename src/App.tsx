import { createBrowserRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'

import { AppProviders } from './AppProviders.tsx'
import { ROUTES } from './routes.ts'
import { createPersistedStore } from './store/store.ts'

const router = createBrowserRouter(ROUTES)
const store = createPersistedStore()

export type AppProps = Record<string, never>

export default function App(): React.JSX.Element {
  return (
    <AppProviders store={store}>
      <RouterProvider router={router} />
    </AppProviders>
  )
}
