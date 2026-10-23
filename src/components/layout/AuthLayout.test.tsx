import { render, screen, within } from '@testing-library/react'
import { createMemoryRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { describe, expect, it } from 'vitest'

import { AppProviders } from '../../AppProviders.tsx'
import { ROUTES } from '../../routes.ts'

function renderAt(path: string): void {
  render(
    <AppProviders>
      <RouterProvider router={createMemoryRouter(ROUTES, { initialEntries: [path] })} />
    </AppProviders>,
  )
}

describe('AuthLayout', () => {
  it.each([
    ['/login', 'Log in to Old Town Market'],
    ['/signup', 'Create your account'],
  ])('wraps %s with the support link, panel and footer', async (path, heading) => {
    renderAt(path)

    const main = await screen.findByRole('main')
    expect(within(main).getByRole('heading', { level: 1, name: heading })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Contact support' })).toBeInTheDocument()
    expect(screen.getByText('A home for your products')).toBeInTheDocument()

    const legal = screen.getByRole('navigation', { name: 'Legal' })
    expect(within(legal).getByRole('link', { name: 'Privacy policy' })).toBeInTheDocument()
    expect(within(legal).getByRole('link', { name: 'Terms of service' })).toBeInTheDocument()
  })
})
