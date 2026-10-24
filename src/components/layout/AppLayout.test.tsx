import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import App from '../../App.tsx'
import { getToken, saveToken, saveUsername } from '../../helpers/tokenStorage.ts'
import { listProducts } from '../../services/productService.ts'

import type * as ProductService from '../../services/productService.ts'

vi.mock('../../services/productService.ts', async (importOriginal) => ({
  ...(await importOriginal<typeof ProductService>()),
  listProducts: vi.fn(),
}))

function renderAt(path: string): void {
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.mocked(listProducts).mockResolvedValue({ error: false, data: { products: [], total: 0 } })
  localStorage.clear()
  saveToken('t')
  saveUsername('emilys')
})

describe('AppLayout', () => {
  it('shows the logged-in username in the header', () => {
    renderAt('/dashboard')
    expect(within(screen.getByRole('banner')).getByText('emilys')).toBeInTheDocument()
  })

  it('navigates with the sidebar links and marks the active one', async () => {
    const user = userEvent.setup()
    renderAt('/dashboard')
    const nav = screen.getByRole('navigation', { name: 'Main' })

    expect(within(nav).getByRole('link', { name: 'Dashboard' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    await user.click(within(nav).getByRole('link', { name: 'Products' }))
    expect(await screen.findByRole('heading', { name: 'Product List' })).toBeInTheDocument()
    expect(within(nav).getByRole('link', { name: 'Products' })).toHaveAttribute(
      'aria-current',
      'page',
    )

    await user.click(within(nav).getByRole('link', { name: 'Dashboard' }))
    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument()
  })

  it('logs out and returns to the login page', async () => {
    const user = userEvent.setup()
    renderAt('/dashboard')
    await user.click(screen.getByRole('button', { name: 'Log out' }))
    expect(screen.getByRole('heading', { name: 'Log in' })).toBeInTheDocument()
    expect(getToken()).toBeNull()
  })

  it('toggles the sidebar from the menu button and closes it with Escape', async () => {
    const user = userEvent.setup()
    renderAt('/dashboard')
    const menu = screen.getByRole('button', { name: 'Menu' })

    expect(menu).toHaveAttribute('aria-expanded', 'false')
    await user.click(menu)
    expect(menu).toHaveAttribute('aria-expanded', 'true')
    await user.keyboard('{Escape}')
    expect(menu).toHaveAttribute('aria-expanded', 'false')
  })
})
