import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AppProviders } from '../AppProviders.tsx'
import { saveToken } from '../helpers/tokenStorage.ts'
import { ROUTES } from '../routes.ts'
import { setupStore } from '../store/store.ts'

import type { CartItem } from '../domains/cart/index.ts'

const ME = {
  id: 1,
  username: 'emilys',
  email: 'e@x.com',
  firstName: 'Emily',
  lastName: 'J',
  image: '',
}

beforeEach(() => {
  vi.stubEnv('VITE_API_BASE_URL', 'https://api.test')
  vi.stubGlobal(
    'fetch',
    vi
      .fn<typeof fetch>()
      .mockImplementation(() => Promise.resolve(new Response(JSON.stringify(ME)))),
  )
  saveToken('access-token')
})

function renderCart(items: CartItem[]): ReturnType<typeof userEvent.setup> {
  const router = createMemoryRouter(ROUTES, { initialEntries: ['/cart'] })
  render(
    <AppProviders store={setupStore({ cart: { items } })}>
      <RouterProvider router={router} />
    </AppProviders>,
  )
  return userEvent.setup()
}

const CHAIR: CartItem = { id: 1, title: 'Chair', price: 50, thumbnail: '', quantity: 2 }
const LAMP: CartItem = { id: 2, title: 'Lamp', price: 9.99, thumbnail: '', quantity: 1 }

describe('/cart', () => {
  it('lists the items with the total and the header count', async () => {
    renderCart([CHAIR, LAMP])

    expect(await screen.findByRole('heading', { level: 1, name: 'Cart' })).toBeInTheDocument()
    const items = within(screen.getByRole('list', { name: 'Cart items' })).getAllByRole('listitem')
    expect(items).toHaveLength(2)
    expect(items[0]).toHaveTextContent('$50 each')
    expect(items[0]).toHaveTextContent('$100')
    expect(screen.getByText('3 items')).toBeInTheDocument()
    expect(screen.getByText('$109.99')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Cart, 3 items' })).toHaveAttribute('href', '/cart')
  })

  it('changes quantities and removes items', async () => {
    const user = renderCart([CHAIR, LAMP])

    await user.click(await screen.findByRole('button', { name: 'Add one more Chair' }))
    expect(screen.getByText('$159.99')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Remove one Lamp' }))
    expect(screen.queryByText('Lamp')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Remove Chair from cart' }))

    expect(screen.getByRole('heading', { name: 'Your cart is empty' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Cart, empty' })).toBeInTheDocument()
  })

  it('clears the cart after confirming', async () => {
    const user = renderCart([CHAIR])

    await user.click(await screen.findByRole('button', { name: 'Clear cart' }))
    const modal = screen.getByRole('alertdialog', { name: 'Clear the cart ?' })
    await user.click(within(modal).getByRole('button', { name: 'Clear' }))

    expect(screen.getByRole('heading', { name: 'Your cart is empty' })).toBeInTheDocument()
  })
})
