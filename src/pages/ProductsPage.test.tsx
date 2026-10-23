import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AppProviders } from '../AppProviders.tsx'
import { flashState } from '../helpers/flashMessage.ts'
import { saveToken } from '../helpers/tokenStorage.ts'
import { ROUTES } from '../routes.ts'

const ME = {
  id: 1,
  username: 'emilys',
  email: 'e@x.com',
  firstName: 'Emily',
  lastName: 'J',
  image: '',
}

function product(id: number, title = `Product ${String(id)}`): Record<string, unknown> {
  return { id, title, brand: 'Acme', category: 'furniture', price: 1199, thumbnail: '' }
}

const fetchMock = vi.fn<typeof fetch>()
// Answers for /products list requests; the URL is passed in so tests can vary by page or query.
let listBody: (url: string) => unknown

beforeEach(() => {
  vi.stubEnv('VITE_API_BASE_URL', 'https://api.test')
  vi.stubGlobal('fetch', fetchMock)
  saveToken('access-token')
  listBody = () => ({ products: [], total: 0 })
  fetchMock.mockReset().mockImplementation((input, init) => {
    const url = typeof input === 'string' ? input : ''
    if (url.endsWith('/auth/me')) {
      return Promise.resolve(new Response(JSON.stringify(ME)))
    }
    if (init?.method === 'DELETE') {
      return Promise.resolve(new Response(JSON.stringify({ id: 2, isDeleted: true })))
    }
    if (url.endsWith('/products/category-list')) {
      return Promise.resolve(new Response(JSON.stringify(['furniture', 'beauty'])))
    }
    return Promise.resolve(new Response(JSON.stringify(listBody(url))))
  })
})

function renderProducts(state?: unknown): ReturnType<typeof createMemoryRouter> {
  const router = createMemoryRouter(ROUTES, {
    initialEntries: [{ pathname: '/products', state }],
  })
  render(
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>,
  )
  return router
}

function listUrls(): string[] {
  return fetchMock.mock.calls
    .map(([input]) => (typeof input === 'string' ? input : ''))
    .filter((url) => url.includes('/products') && !url.endsWith('/category-list'))
}

describe('/products', () => {
  it('shows the empty state when there are no products', async () => {
    renderProducts()

    const main = await screen.findByRole('main')
    expect(within(main).getByRole('heading', { level: 1, name: 'Product List' })).toBeVisible()
    expect(
      await within(main).findByRole('heading', { level: 2, name: 'No products yet' }),
    ).toBeInTheDocument()
    expect(within(main).getAllByRole('link', { name: 'Add Product' })[0]).toHaveAttribute(
      'href',
      '/products/new',
    )
  })

  it('lists products as cards and pages through them', async () => {
    const user = userEvent.setup()
    listBody = (url) =>
      url.includes('skip=10')
        ? { products: [product(11)], total: 11 }
        : { products: [product(1, 'RCC Cement'), product(2)], total: 11 }
    renderProducts()

    const card = (await screen.findByRole('link', { name: 'RCC Cement' })).closest('li')
    expect(card).not.toBeNull()
    expect(card).toHaveTextContent('Acme / furniture')
    expect(card).toHaveTextContent('$1,199')
    expect(screen.getByRole('link', { name: 'RCC Cement' })).toHaveAttribute('href', '/products/1')
    expect(screen.getByText('1–10 of 11')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Next page' }))

    expect(await screen.findByRole('link', { name: 'Product 11' })).toBeInTheDocument()
    expect(screen.getByText('11–11 of 11')).toBeInTheDocument()
  })

  it('shows shimmer cards while loading', async () => {
    renderProducts()
    const region = (await screen.findByText('Loading products…')).closest('[role="status"]')
    expect(region).toHaveAttribute('aria-busy', 'true')
  })

  it('adds to the cart from a card and updates the header count', async () => {
    const user = userEvent.setup()
    listBody = () => ({ products: [product(1, 'RCC Cement')], total: 1 })
    renderProducts()

    await user.click(await screen.findByRole('button', { name: 'Add RCC Cement to cart' }))
    await user.click(screen.getByRole('button', { name: 'Add one more RCC Cement' }))

    expect(screen.getByRole('link', { name: 'Cart, 2 items' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Remove one RCC Cement' }))
    await user.click(screen.getByRole('button', { name: 'Remove one RCC Cement' }))
    expect(screen.getByRole('button', { name: 'Add RCC Cement to cart' })).toBeInTheDocument()
  })

  it('opens only the menu from ⋮, without leaving the list', async () => {
    const user = userEvent.setup()
    listBody = () => ({ products: [product(1, 'RCC Cement')], total: 1 })
    const router = renderProducts()

    await user.click(await screen.findByRole('button', { name: 'Actions for RCC Cement' }))

    expect(router.state.location.pathname).toBe('/products')
    expect(screen.getByRole('link', { name: 'View details' })).toHaveAttribute(
      'href',
      '/products/1',
    )
  })

  it('searches after typing stops', async () => {
    const user = userEvent.setup()
    listBody = (url) =>
      url.includes('search?q=chair')
        ? { products: [product(5, 'Office Chair')], total: 1 }
        : { products: [product(1)], total: 1 }
    renderProducts()
    await screen.findByRole('link', { name: 'Product 1' })

    await user.type(screen.getByRole('searchbox', { name: 'Search products' }), 'chair')

    expect(await screen.findByRole('link', { name: 'Office Chair' })).toBeInTheDocument()
    expect(listUrls().filter((url) => url.includes('/search?'))).toHaveLength(1)
  })

  it('filters by category only after Apply', async () => {
    const user = userEvent.setup()
    listBody = (url) =>
      url.includes('/category/beauty')
        ? { products: [product(9, 'Lipstick')], total: 1 }
        : { products: [product(1)], total: 1 }
    renderProducts()
    await screen.findByRole('link', { name: 'Product 1' })

    await user.click(screen.getByRole('button', { name: 'Filter' }))
    await user.selectOptions(await screen.findByLabelText('Category'), 'beauty')
    expect(listUrls().some((url) => url.includes('/category/'))).toBe(false)
    await user.click(screen.getByRole('button', { name: 'Apply' }))

    expect(await screen.findByRole('link', { name: 'Lipstick' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Filter (1 applied)' })).toBeInTheDocument()
  })

  it('deletes a product after confirming in the modal', async () => {
    const user = userEvent.setup()
    listBody = () => ({ products: [product(1), product(2, 'Old Chair')], total: 2 })
    renderProducts()

    await user.click(await screen.findByRole('button', { name: 'Actions for Old Chair' }))
    await user.click(screen.getByRole('button', { name: 'Delete' }))
    const modal = screen.getByRole('alertdialog', { name: 'Do you want to delete ?' })
    await user.click(within(modal).getByRole('button', { name: 'Delete' }))

    expect(await screen.findByRole('status')).toHaveTextContent('“Old Chair” was deleted.')
    expect(screen.queryByRole('link', { name: 'Old Chair' })).not.toBeInTheDocument()
    expect(screen.getByText('1–1 of 1')).toBeInTheDocument()
    const deleteCall = fetchMock.mock.calls.find(([, init]) => init?.method === 'DELETE')
    expect(deleteCall?.[0]).toBe('https://api.test/products/2')
  })

  it('keeps the product when the delete is cancelled', async () => {
    const user = userEvent.setup()
    listBody = () => ({ products: [product(2, 'Old Chair')], total: 1 })
    renderProducts()

    await user.click(await screen.findByRole('button', { name: 'Actions for Old Chair' }))
    await user.click(screen.getByRole('button', { name: 'Delete' }))
    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Old Chair' })).toBeInTheDocument()
    expect(fetchMock.mock.calls.some(([, init]) => init?.method === 'DELETE')).toBe(false)
  })

  it('shows the success modal once, with Home going to the dashboard', async () => {
    const user = userEvent.setup()
    const router = renderProducts(flashState('Product Added Successfully', 'Saved.'))

    const modal = await screen.findByRole('dialog', { name: 'Product Added Successfully' })
    // Cleared by an effect after the first render, so wait for it.
    await waitFor(() => {
      expect(router.state.location.state).toBeNull()
    })
    await user.click(within(modal).getByRole('button', { name: 'Home' }))

    expect(router.state.location.pathname).toBe('/dashboard')
  })
})
