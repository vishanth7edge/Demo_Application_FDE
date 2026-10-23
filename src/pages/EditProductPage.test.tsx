import { render, screen } from '@testing-library/react'
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
  lastName: 'Johnson',
  image: '',
}
const PRODUCT = {
  id: 1,
  title: 'Essence Mascara',
  description: 'Long lashes',
  category: 'beauty',
  price: 9.99,
  thumbnail: 'https://cdn.test/thumb.webp',
}

const fetchMock = vi.fn<typeof fetch>()
let productResponse: () => Promise<Response>

beforeEach(() => {
  vi.stubEnv('VITE_API_BASE_URL', 'https://api.test')
  vi.stubGlobal('fetch', fetchMock)
  saveToken('access-token')
  productResponse = () => Promise.resolve(new Response(JSON.stringify(PRODUCT)))
  fetchMock.mockReset().mockImplementation((input, init) => {
    const url = typeof input === 'string' ? input : ''
    if (url.endsWith('/auth/me')) {
      return Promise.resolve(new Response(JSON.stringify(ME)))
    }
    if (init?.method === 'PUT') {
      return Promise.resolve(new Response(JSON.stringify({ id: 1 })))
    }
    return productResponse()
  })
})

function productCalls(): string[] {
  return fetchMock.mock.calls
    .map(([input]) => (typeof input === 'string' ? input : ''))
    .filter((url) => url.includes('/products/'))
}

function renderAt(path: string): ReturnType<typeof userEvent.setup> {
  render(
    <AppProviders>
      <RouterProvider router={createMemoryRouter(ROUTES, { initialEntries: [path] })} />
    </AppProviders>,
  )
  return userEvent.setup()
}

describe('EditProductPage', () => {
  it('shows "Product not found" for a non-numeric id without calling the API', async () => {
    renderAt('/products/abc/edit')

    expect(await screen.findByRole('heading', { name: 'Product not found' })).toBeInTheDocument()
    expect(productCalls()).toHaveLength(0)
  })

  it('shows "Product not found" when the API answers 404', async () => {
    productResponse = () =>
      Promise.resolve(
        new Response(JSON.stringify({ message: "Product with id '9999' not found" }), {
          status: 404,
        }),
      )
    renderAt('/products/9999/edit')

    expect(await screen.findByRole('heading', { name: 'Product not found' })).toBeInTheDocument()
    expect(productCalls()).toEqual(['https://api.test/products/9999'])
  })

  it('shows a loading state, then the pre-filled form with the current thumbnail', async () => {
    let respond: (response: Response) => void = () => undefined
    productResponse = () =>
      new Promise((resolve) => {
        respond = resolve
      })
    renderAt('/products/1/edit')

    expect(await screen.findByText('Loading product…')).toBeInTheDocument()
    respond(new Response(JSON.stringify(PRODUCT)))

    expect(await screen.findByLabelText('Product Name')).toHaveValue('Essence Mascara')
    expect(screen.getByLabelText('Product Category')).toHaveValue('beauty')
    expect(screen.getByLabelText('Product Description')).toHaveValue('Long lashes')
    expect(screen.getByLabelText('Rate per Unit')).toHaveValue('9.99')
    expect(screen.getByRole('img', { name: 'Current product image' })).toHaveAttribute(
      'src',
      'https://cdn.test/thumb.webp',
    )
  })

  it('sends the changes with PUT as FormData and returns to /products', async () => {
    const user = renderAt('/products/1/edit')
    const name = await screen.findByLabelText('Product Name')
    await user.clear(name)
    await user.type(name, 'Mascara XL')

    await user.click(screen.getByRole('button', { name: 'Save Changes' }))

    expect(
      await screen.findByRole('dialog', { name: 'Product Updated Successfully' }),
    ).toHaveTextContent('Product 1 was saved')
    const put = fetchMock.mock.calls.find(([, init]) => init?.method === 'PUT')
    expect(put?.[0]).toBe('https://api.test/products/1')
    const body = put?.[1]?.body
    expect(body instanceof FormData ? body.get('title') : null).toBe('Mascara XL')
  })
})
