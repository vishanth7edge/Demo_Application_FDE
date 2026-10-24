import { Navigate, Route, Routes } from 'react-router'

import AuthProvider from './components/auth/AuthProvider.tsx'
import ProtectedRoute from './components/auth/ProtectedRoute.tsx'
import AppLayout from './components/layout/AppLayout.tsx'
import AddProductPage from './pages/AddProductPage.tsx'
import DashboardPage from './pages/DashboardPage.tsx'
import LoginPage from './pages/LoginPage.tsx'
import NotFoundPage from './pages/NotFoundPage.tsx'
import ProductDetailPage from './pages/ProductDetailPage.tsx'
import ProductsPage from './pages/ProductsPage.tsx'
import SignupPage from './pages/SignupPage.tsx'

export default function App(): React.JSX.Element {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/products/new" element={<AddProductPage />} />
            <Route path="/products/:id" element={<ProductDetailPage />} />
          </Route>
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AuthProvider>
  )
}
