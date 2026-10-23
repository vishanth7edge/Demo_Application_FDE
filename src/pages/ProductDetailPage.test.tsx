import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AppProviders } from '../AppProviders.tsx'
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
const PRODUCT = {
  id: 7,
  title: 'RCC Cement',
  description: 'Ordinary Portland cement',
  category: 'construction',
  brand: 'Saudi Cement',
  price: 200,
  thumbnail: 'https://cdn.test/t.webp',
  images: ['https://cdn.test/1.webp', 'https://cdn.test/2.webp'],
  dimensions: { width: 12, height: 12, depth: 12 },
}

const fetchMock = vi.fn<typeof fetch>()

beforeEach(() => {
  vi.stubEnv('VITE_API_BASE_URL', 'https://api.test')
  vi.stubGlobal('fetch', fetchMock)
  saveToken('access-token')
  fetchMock.mockReset().mockImplementation((input) => {
    const url = typeof input === 'string' ? input : ''
    if (url.endsWith('/auth/me')) {
      return Promise.resolve(new Response(JSON.stringify(ME)))
    }
    if (url.endsWith('/products/7')) {
      return Promise.resolve(new Response(JSON.stringify(PRODUCT)))
    }
    return Promise.resolve(new Response(JSON.stringify({ message: 'Not found' }), { status: 404 }))
  })
})

function renderAt(path: string): ReturnType<typeof userEvent.setup> {
  const router = createMemoryRouter(ROUTES, { initialEntries: [path] })
  render(
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>,
  )
  return userEvent.setup()
}

describe('/products/:id', () => {
  it('shows the details, an Edit Product link and the vendor tabs', async () => {
    renderAt('/products/7')

    expect(await screen.findByRole('heading', { level: 1, name: 'Product Detail' })).toBeVisible()
    expect(screen.getByRole('link', { name: 'Edit Product' })).toHaveAttribute(
      'href',
      '/products/7/edit',
    )
    expect(screen.getByText('Ordinary Portland cement')).toBeInTheDocument()
    expect(screen.getByText('$200')).toBeInTheDocument()
    expect(screen.getByText('12 × 12 × 12')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Vendor Assigned' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(screen.getByText('Add Vendors to Expand Your Business Network')).toBeInTheDocument()
  })

  it('moves through the images with the arrows and thumbnails', async () => {
    const user = renderAt('/products/7')

    const first = await screen.findByRole('img', { name: 'RCC Cement, image 1 of 2' })
    expect(first).toHaveAttribute('src', 'https://cdn.test/1.webp')
    await user.click(screen.getByRole('button', { name: 'Next image' }))
    expect(screen.getByRole('img', { name: 'RCC Cement, image 2 of 2' })).toHaveAttribute(
      'src',
      'https://cdn.test/2.webp',
    )
    await user.click(screen.getByRole('button', { name: 'Next image' }))
    expect(screen.getByRole('button', { name: 'Show image 1' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('goes back to the list from the header breadcrumb', async () => {
    const user = renderAt('/products/7')
    const breadcrumb = await screen.findByRole('navigation', { name: 'Breadcrumb' })
    expect(within(breadcrumb).getByText('Product Detail')).toHaveAttribute('aria-current', 'page')

    await user.click(within(breadcrumb).getByRole('link', { name: 'Product List' }))

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Product List' }),
    ).toBeInTheDocument()
  })

  it('switches vendor tabs', async () => {
    const user = renderAt('/products/7')

    await user.click(await screen.findByRole('tab', { name: 'Assignment Request' }))

    expect(
      within(screen.getByRole('tabpanel')).getByText('No assignment requests yet'),
    ).toBeVisible()
  })

  it('shows "Product not found" for an unknown id', async () => {
    renderAt('/products/999')

    expect(
      await screen.findByRole('heading', { level: 2, name: 'Product not found' }),
    ).toBeInTheDocument()
  })
})
