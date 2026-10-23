import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AppProviders } from './AppProviders.tsx'
import { getToken, saveToken } from './helpers/tokenStorage.ts'
import { ROUTES } from './routes.ts'

const ME_RESPONSE = {
  id: 1,
  username: 'emilys',
  email: 'emily@example.com',
  firstName: 'Emily',
  lastName: 'Johnson',
  image: 'https://dummyjson.com/icon/emilys/128',
}

const fetchMock = vi.fn<typeof fetch>()

beforeEach(() => {
  vi.stubEnv('VITE_API_BASE_URL', 'https://api.test')
  vi.stubGlobal('fetch', fetchMock)
  fetchMock.mockReset()
})

function renderAt(path: string): ReturnType<typeof createMemoryRouter> {
  const router = createMemoryRouter(ROUTES, { initialEntries: [path] })
  render(
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>,
  )
  return router
}

describe('routes', () => {
  it('redirects / to /login', async () => {
    const router = renderAt('/')

    expect(
      await screen.findByRole('heading', { name: 'Log in to Old Town Market' }),
    ).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/login')
  })

  it('links from login to signup and back', async () => {
    const user = userEvent.setup()
    renderAt('/login')

    await user.click(await screen.findByRole('link', { name: 'Sign up' }))
    expect(await screen.findByRole('heading', { name: 'Create your account' })).toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: 'Log in' }))
    expect(
      await screen.findByRole('heading', { name: 'Log in to Old Town Market' }),
    ).toBeInTheDocument()
  })

  it('renders the not found page for unknown paths', async () => {
    renderAt('/does-not-exist')

    expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
  })
})

describe('protected /dashboard', () => {
  it('redirects to /login when logged out', async () => {
    const router = renderAt('/dashboard')

    expect(
      await screen.findByRole('heading', { name: 'Log in to Old Town Market' }),
    ).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/login')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('restores the session from a saved token and shows the first name', async () => {
    saveToken('access-token')
    let respond: (response: Response) => void = () => undefined
    fetchMock.mockReturnValue(
      new Promise<Response>((resolve) => {
        respond = resolve
      }),
    )
    renderAt('/dashboard')

    expect(await screen.findByRole('status')).toHaveTextContent('Loading…')

    respond(new Response(JSON.stringify(ME_RESPONSE)))

    expect(await screen.findByText('Welcome, Emily!')).toBeInTheDocument()
  })

  it('drops an expired token and redirects to /login', async () => {
    saveToken('expired-token')
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ message: 'Invalid/Expired Token!' }), { status: 401 }),
    )
    const router = renderAt('/dashboard')

    expect(
      await screen.findByRole('heading', { name: 'Log in to Old Town Market' }),
    ).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/login')
    expect(getToken()).toBeNull()
  })

  it('logs out from the dashboard', async () => {
    saveToken('access-token')
    fetchMock.mockResolvedValue(new Response(JSON.stringify(ME_RESPONSE)))
    const user = userEvent.setup()
    const router = renderAt('/dashboard')

    await user.click(await screen.findByRole('button', { name: 'Logout' }))

    expect(
      await screen.findByRole('heading', { name: 'Log in to Old Town Market' }),
    ).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/login')
    expect(getToken()).toBeNull()
  })
})
