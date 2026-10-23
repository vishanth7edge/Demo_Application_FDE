import { redirect } from 'react-router'

import { AppLayout } from './components/layout/AppLayout.tsx'
import { AuthLayout } from './components/layout/AuthLayout.tsx'
import { ProtectedRoute } from './components/ProtectedRoute.tsx'
import { AddProductPage } from './pages/AddProductPage.tsx'
import { CartPage } from './pages/CartPage.tsx'
import { ComingSoonPage } from './pages/ComingSoonPage.tsx'
import { DashboardPage } from './pages/DashboardPage.tsx'
import { EditProductPage } from './pages/EditProductPage.tsx'
import { LoginPage } from './pages/LoginPage.tsx'
import { NotFoundPage } from './pages/NotFoundPage.tsx'
import { ProductDetailPage } from './pages/ProductDetailPage.tsx'
import { ProductsPage } from './pages/ProductsPage.tsx'
import { SignupPage } from './pages/SignupPage.tsx'

import type { RouteObject } from 'react-router'

// Breadcrumb step back to the list, shown as a link in the header.
const PRODUCT_LIST_CRUMB = [{ label: 'Product List', to: '/products' }]

// Shared by the browser router in App.tsx and by tests (createMemoryRouter).
export const ROUTES: RouteObject[] = [
  { path: '/', loader: () => redirect('/login') },
  {
    Component: AuthLayout,
    children: [
      { path: '/login', Component: LoginPage },
      { path: '/signup', Component: SignupPage },
    ],
  },
  {
    // Every child of AppLayout is protected and gets the header and sidebar.
    Component: ProtectedRoute,
    children: [
      {
        Component: AppLayout,
        children: [
          // `handle.title` is shown in the header (and by ComingSoonPage); `handle.parents` are the
          // breadcrumb links before it.
          { path: '/dashboard', Component: DashboardPage, handle: { title: 'Dashboard' } },
          { path: '/products', Component: ProductsPage, handle: { title: 'Product List' } },
          {
            path: '/products/new',
            Component: AddProductPage,
            handle: { title: 'Add Product', parents: PRODUCT_LIST_CRUMB },
          },
          {
            path: '/products/:id',
            Component: ProductDetailPage,
            handle: { title: 'Product Detail', parents: PRODUCT_LIST_CRUMB },
          },
          {
            path: '/products/:id/edit',
            Component: EditProductPage,
            handle: { title: 'Edit Product', parents: PRODUCT_LIST_CRUMB },
          },
          { path: '/cart', Component: CartPage, handle: { title: 'Cart' } },
          { path: '/orders', Component: ComingSoonPage, handle: { title: 'Orders' } },
          { path: '/vendors', Component: ComingSoonPage, handle: { title: 'Vendors' } },
          { path: '/settings', Component: ComingSoonPage, handle: { title: 'Settings' } },
        ],
      },
    ],
  },
  { path: '*', Component: NotFoundPage },
]
