import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AppProviders } from '../../AppProviders.tsx'
import { saveToken } from '../../helpers/tokenStorage.ts'
import { ROUTES } from '../../routes.ts'

const ME_RESPONSE = {
  id: 1,
  username: 'emilys',
  email: 'emily@example.com',
  firstName: 'Emily',
  lastName: 'Johnson',
  image: 'https://dummyjson.com/icon/emilys/128',
}

beforeEach(() => {
  vi.stubEnv('VITE_API_BASE_URL', 'https://api.test')
  vi.stubGlobal(
    'fetch',
    vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify(ME_RESPONSE))),
  )
  saveToken('access-token')
})

async function renderLoggedInAt(path: string): Promise<ReturnType<typeof createMemoryRouter>> {
  const router = createMemoryRouter(ROUTES, { initialEntries: [path] })
  render(
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>,
  )
  await screen.findByRole('banner')
  return router
}

function sidebar(): HTMLElement {
  const nav = screen.getByRole('navigation', { name: 'Main' })
  const aside = nav.closest('aside')
  if (aside === null) {
    throw new Error('sidebar <aside> not found')
  }
  return aside
}

describe('AppLayout', () => {
  it('shows the user name and initials in the sidebar, not the header', async () => {
    await renderLoggedInAt('/dashboard')

    const userLink = within(sidebar()).getByRole('link', { name: 'Emily Johnson' })
    expect(userLink).toHaveAttribute('href', '/settings')
    expect(within(userLink).getByText('EJ')).toBeInTheDocument()
    expect(within(screen.getByRole('banner')).queryByText(/Emily/)).not.toBeInTheDocument()
  })

  it('shows the route title and a notifications button in the header', async () => {
    await renderLoggedInAt('/products')

    const header = screen.getByRole('banner')
    expect(within(header).getByText('Product List')).toBeInTheDocument()
    expect(within(header).getByRole('button', { name: 'Notifications' })).toBeInTheDocument()
  })

  it.each([
    ['Dashboard', '/dashboard', 'Dashboard'],
    ['Products', '/products', 'Product List'],
    ['Orders', '/orders', 'Orders'],
    ['Vendors', '/vendors', 'Vendors'],
    ['Settings', '/settings', 'Settings'],
  ])('the %s link navigates to %s', async (label, path, heading) => {
    const user = userEvent.setup()
    const start = path === '/dashboard' ? '/products' : '/dashboard'
    const router = await renderLoggedInAt(start)

    await user.click(within(sidebar()).getByRole('link', { name: label }))

    expect(router.state.location.pathname).toBe(path)
    expect(
      within(screen.getByRole('main')).getByRole('heading', { level: 1, name: heading }),
    ).toBeInTheDocument()
    expect(within(sidebar()).getByRole('link', { name: label })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })

  it('opens the mobile menu, and closes it with Escape, the close button or a link', async () => {
    const user = userEvent.setup()
    await renderLoggedInAt('/dashboard')
    const menuButton = screen.getByRole('button', { name: 'Menu' })
    expect(menuButton).toHaveAttribute('aria-controls', sidebar().id)

    await user.click(menuButton)
    expect(menuButton).toHaveAttribute('aria-expanded', 'true')
    await user.keyboard('{Escape}')
    expect(menuButton).toHaveAttribute('aria-expanded', 'false')

    await user.click(menuButton)
    await user.click(screen.getByRole('button', { name: 'Close menu' }))
    expect(menuButton).toHaveAttribute('aria-expanded', 'false')

    await user.click(menuButton)
    await user.click(within(sidebar()).getByRole('link', { name: 'Products' }))
    expect(menuButton).toHaveAttribute('aria-expanded', 'false')
  })

  it('logs out from the sidebar', async () => {
    const user = userEvent.setup()
    const router = await renderLoggedInAt('/products')

    await user.click(within(sidebar()).getByRole('button', { name: 'Logout' }))

    expect(
      await screen.findByRole('heading', { name: 'Log in to Old Town Market' }),
    ).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/login')
  })
})
