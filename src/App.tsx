import { Navigate, Route, Routes } from 'react-router'

import { AuthenticatedLayout } from './app/AuthenticatedLayout.tsx'
import { NotFoundPage } from './app/NotFoundPage.tsx'
import { canManageProducts, useAuth } from './domains/auth/index.ts'
import { RedirectIfAuthenticated, RequireAuth, RequireRole } from './domains/auth/index.ts'
import { ForgotPasswordPage, LoginPage } from './domains/auth/index.ts'
import { DashboardPage } from './domains/dashboard/index.ts'
import {
  ProductCreatePage,
  ProductDetailPage,
  ProductEditPage,
  ProductListPage,
} from './domains/products/index.ts'
import { useFlashMessages } from './shared/feedback/useFlashMessages.ts'

function DashboardRoute(): React.JSX.Element {
  const { user } = useAuth()
  return <DashboardPage userName={user?.name ?? ''} />
}

function ProductListRoute(): React.JSX.Element {
  const { user } = useAuth()
  return <ProductListPage canManage={canManageProducts(user)} />
}

export type AppProps = Record<string, never>

export default function App(_props: AppProps): React.JSX.Element {
  useFlashMessages()

  return (
    <Routes>
      <Route index element={<Navigate to="/dashboard" replace />} />

      <Route element={<RedirectIfAuthenticated />}>
        <Route path="login" element={<LoginPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
      </Route>

      <Route element={<RequireAuth />}>
        <Route element={<AuthenticatedLayout />}>
          <Route path="dashboard" element={<DashboardRoute />} />
          <Route path="products" element={<ProductListRoute />} />
          <Route path="products/:productId" element={<ProductDetailPage />} />
          <Route
            element={
              <RequireRole
                role="admin"
                redirectTo="/products"
                message="You don't have permission to add or edit products."
              />
            }
          >
            <Route path="products/new" element={<ProductCreatePage />} />
            <Route path="products/:productId/edit" element={<ProductEditPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
