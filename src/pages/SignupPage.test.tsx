import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'

import { SignupPage } from './SignupPage.tsx'

describe('SignupPage', () => {
  it('shows errors only after submit and clears a field error when it is edited', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <SignupPage />
      </MemoryRouter>,
    )

    expect(screen.queryByText('First name is required')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Create account' }))

    const nameInput = screen.getByLabelText('First name')
    expect(nameInput).toHaveAccessibleDescription('First name is required')
    expect(nameInput).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByText('Email is required')).toBeInTheDocument()

    await user.type(nameInput, 'Alice')

    expect(screen.queryByText('First name is required')).not.toBeInTheDocument()
    expect(screen.getByText('Email is required')).toBeInTheDocument()
  })

  it('reports mismatched passwords', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <SignupPage />
      </MemoryRouter>,
    )

    await user.type(screen.getByLabelText('Password'), 'abcd1234')
    await user.type(screen.getByLabelText('Confirm password'), 'abcd9999')
    await user.click(screen.getByRole('button', { name: 'Create account' }))

    expect(screen.getByText('Passwords do not match')).toBeInTheDocument()
  })
})
