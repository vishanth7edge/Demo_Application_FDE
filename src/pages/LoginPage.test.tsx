import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AppProviders } from '../AppProviders.tsx'
import { getToken } from '../helpers/tokenStorage.ts'
import { ROUTES } from '../routes.ts'

const fetchMock = vi.fn<typeof fetch>()

beforeEach(() => {
  vi.stubEnv('VITE_API_BASE_URL', 'https://api.test')
  vi.stubGlobal('fetch', fetchMock)
  fetchMock.mockReset()
})

function renderLogin(): void {
  render(
    <AppProviders>
      <RouterProvider router={createMemoryRouter(ROUTES, { initialEntries: ['/login'] })} />
    </AppProviders>,
  )
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status })
}

async function fillAndSubmit(): Promise<ReturnType<typeof userEvent.setup>> {
  const user = userEvent.setup()
  renderLogin()
  await user.type(await screen.findByLabelText('Username'), 'emilys')
  await user.type(screen.getByLabelText('Password'), 'emilyspass')
  await user.click(screen.getByRole('button', { name: 'Log in' }))
  return user
}

describe('LoginPage', () => {
  it('does not call the API when the form is invalid', async () => {
    const user = userEvent.setup()
    renderLogin()

    await user.click(await screen.findByRole('button', { name: 'Log in' }))

    expect(screen.getByText('Username is required')).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('shows a loading state, then the API error', async () => {
    let respond: (response: Response) => void = () => undefined
    fetchMock.mockReturnValue(
      new Promise<Response>((resolve) => {
        respond = resolve
      }),
    )

    await fillAndSubmit()

    const button = screen.getByRole('button', { name: 'Logging in…' })
    expect(button).toBeDisabled()
    expect(screen.getByLabelText('Username')).toBeDisabled()

    respond(jsonResponse({ message: 'Invalid credentials' }, 400))

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid credentials')
    expect(screen.getByRole('button', { name: 'Log in' })).toBeEnabled()
    expect(getToken()).toBeNull()
  })

  it('saves the token and goes to the dashboard on success', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        id: 1,
        username: 'emilys',
        email: 'emily@example.com',
        firstName: 'Emily',
        lastName: 'Johnson',
        image: 'https://dummyjson.com/icon/emilys/128',
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      }),
    )

    await fillAndSubmit()

    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument()
    expect(screen.getByText('Welcome, Emily!')).toBeInTheDocument()
    expect(getToken()).toBe('access-token')
  })
})
