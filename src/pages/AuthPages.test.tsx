import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import App from '../App.tsx'
import { login } from '../services/authService.ts'

vi.mock('../services/authService.ts', () => ({ login: vi.fn(), signup: vi.fn() }))

const loginMock = vi.mocked(login)

beforeEach(() => {
  loginMock.mockReset()
})

function renderAt(path: string): void {
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
}

describe('LoginPage form', () => {
  it('shows errors on submit and clears one when the field is edited', async () => {
    const user = userEvent.setup()
    renderAt('/login')

    expect(screen.queryByText('Username is required')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Log in' }))
    expect(screen.getByText('Username is required')).toBeInTheDocument()
    expect(screen.getByText('Password is required')).toBeInTheDocument()

    await user.type(screen.getByLabelText('Username'), 'ada')
    expect(screen.queryByText('Username is required')).not.toBeInTheDocument()
  })

  it('shows a loading state, then goes to the dashboard on success', async () => {
    const user = userEvent.setup()
    let finish: (result: Awaited<ReturnType<typeof login>>) => void = () => undefined
    loginMock.mockReturnValue(
      new Promise((resolve) => {
        finish = resolve
      }),
    )
    renderAt('/login')

    await user.type(screen.getByLabelText('Username'), 'ada')
    await user.type(screen.getByLabelText('Password'), 'x')
    await user.click(screen.getByRole('button', { name: 'Log in' }))

    const busyButton = screen.getByRole('button', { name: 'Logging in…' })
    expect(busyButton).toBeDisabled()
    expect(loginMock).toHaveBeenCalledWith({ username: 'ada', password: 'x' })

    finish({ error: false, data: { id: 1, username: 'ada', accessToken: 'token' } })
    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument()
  })

  it('shows the API error and re-enables the button on failure', async () => {
    const user = userEvent.setup()
    loginMock.mockResolvedValue({ error: true, status: 400, message: 'Invalid credentials' })
    renderAt('/login')

    await user.type(screen.getByLabelText('Username'), 'ada')
    await user.type(screen.getByLabelText('Password'), 'x')
    await user.click(screen.getByRole('button', { name: 'Log in' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid credentials')
    expect(screen.getByRole('button', { name: 'Log in' })).toBeEnabled()
  })

  it('does not call the API when validation fails', async () => {
    const user = userEvent.setup()
    renderAt('/login')

    await user.click(screen.getByRole('button', { name: 'Log in' }))

    expect(loginMock).not.toHaveBeenCalled()
  })
})

describe('SignupPage form', () => {
  it('shows a mismatch error for different passwords', async () => {
    const user = userEvent.setup()
    renderAt('/signup')

    await user.type(screen.getByLabelText('Name'), 'Ada')
    await user.type(screen.getByLabelText('Email'), 'ada@example.com')
    await user.type(screen.getByLabelText('Password'), 'abcdefg1')
    await user.type(screen.getByLabelText('Confirm password'), 'abcdefg2')
    await user.click(screen.getByRole('button', { name: 'Sign up' }))

    expect(screen.getByText('Passwords do not match')).toBeInTheDocument()
    expect(screen.getByLabelText('Confirm password')).toHaveAttribute('aria-invalid', 'true')
  })

  it('goes to the login page when valid', async () => {
    const user = userEvent.setup()
    renderAt('/signup')

    await user.type(screen.getByLabelText('Name'), 'Ada')
    await user.type(screen.getByLabelText('Email'), 'ada@example.com')
    await user.type(screen.getByLabelText('Password'), 'abcdefg1')
    await user.type(screen.getByLabelText('Confirm password'), 'abcdefg1')
    await user.click(screen.getByRole('button', { name: 'Sign up' }))

    expect(screen.getByRole('heading', { name: 'Log in to Old Town Market' })).toBeInTheDocument()
  })
})
