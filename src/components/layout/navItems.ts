export interface NavItem {
  to: string
  label: string
  /** Page title shown in the header while this route is active. */
  title: string
}

export const NAV_ITEMS: readonly NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', title: 'Dashboard' },
  { to: '/products', label: 'Products', title: 'Product List' },
]

export interface Crumb {
  label: string
  to?: string | undefined
}

const APP_NAME = 'Old Town Market'

export function getBreadcrumbs(pathname: string): Crumb[] {
  if (pathname === '/products/new') {
    return [{ label: 'Product List', to: '/products' }, { label: 'Add Products' }]
  }
  if (pathname.startsWith('/products/')) {
    return [{ label: 'Product List', to: '/products' }, { label: 'Product Detail' }]
  }
  const item = NAV_ITEMS.find((navItem) => navItem.to === pathname)
  return [{ label: item?.title ?? APP_NAME }]
}
