import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'

import App from './App.tsx'
import { saveToken, saveUsername } from './helpers/tokenStorage.ts'

beforeEach(() => {
  localStorage.clear()
})

function renderAt(path: string): void {
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
}

describe('App routing', () => {
  it('redirects / to the login page', () => {
    renderAt('/')
    expect(screen.getByRole('heading', { name: 'Log in' })).toBeInTheDocument()
  })

  it('renders the signup and dashboard pages', () => {
    renderAt('/signup')
    expect(screen.getByRole('heading', { name: 'Sign up' })).toBeInTheDocument()
  })

  it('renders the dashboard page when logged in', () => {
    saveToken('t')
    saveUsername('emilys')
    renderAt('/dashboard')
    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument()
  })

  it('redirects a logged-out visitor from a protected page to login', () => {
    renderAt('/dashboard')
    expect(screen.getByRole('heading', { name: 'Log in' })).toBeInTheDocument()
  })

  it('renders the not found page for unknown paths', () => {
    renderAt('/nope')
    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
  })

  it('links between login and signup', async () => {
    const user = userEvent.setup()
    renderAt('/login')

    await user.click(screen.getByRole('link', { name: 'Sign up' }))
    expect(screen.getByRole('heading', { name: 'Sign up' })).toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: 'Log in' }))
    expect(screen.getByRole('heading', { name: 'Log in' })).toBeInTheDocument()
  })
})
