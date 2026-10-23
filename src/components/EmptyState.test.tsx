import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { EmptyState } from './EmptyState.tsx'

describe('EmptyState', () => {
  it('renders only the title when nothing else is given', () => {
    const { container } = render(<EmptyState title="No products yet" />)

    expect(screen.getByRole('heading', { name: 'No products yet' })).toBeInTheDocument()
    expect(container.querySelectorAll('p')).toHaveLength(0)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('renders the illustration, description and action', () => {
    render(
      <EmptyState
        title="No products yet"
        description="Add your first product."
        illustration={<img src="/empty.svg" alt="Empty shelves" />}
        action={<button type="button">Add product</button>}
      />,
    )

    expect(screen.getByRole('img', { name: 'Empty shelves' })).toBeInTheDocument()
    expect(screen.getByText('Add your first product.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add product' })).toBeInTheDocument()
  })
})
