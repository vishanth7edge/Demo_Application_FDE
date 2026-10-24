import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import App from '../App.tsx'
import { saveToken, saveUsername } from '../helpers/tokenStorage.ts'
import { getProduct, type Product } from '../services/productService.ts'
import type * as ProductService from '../services/productService.ts'

vi.mock('../services/productService.ts', async (importOriginal) => ({
  ...(await importOriginal<typeof ProductService>()),
  getProduct: vi.fn(),
}))

const getMock = vi.mocked(getProduct)

const product: Product = {
  id: 3,
  title: 'RCC Cement',
  description: 'Grey powder',
  category: 'construction',
  brand: 'Saudi',
  price: 200,
  thumbnail: 'https://img/t.png',
  images: ['https://img/1.png', 'https://img/2.png'],
  size: '12*12*12',
}

function renderAt(path: string): ReturnType<typeof userEvent.setup> {
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
  return userEvent.setup()
}

beforeEach(() => {
  localStorage.clear()
  saveToken('t')
  saveUsername('emilys')
  getMock.mockReset()
  getMock.mockResolvedValue({ error: false, data: product })
})

describe('ProductDetailPage', () => {
  it('shows the product details and breadcrumb', async () => {
    renderAt('/products/3')
    expect(await screen.findByText('RCC Cement')).toBeInTheDocument()
    expect(getMock).toHaveBeenCalledWith(3)
    expect(screen.getByText('Grey powder')).toBeInTheDocument()
    expect(screen.getByText('12*12*12')).toBeInTheDocument()
    expect(screen.getByText('$200')).toBeInTheDocument()
    expect(screen.getByText('Product Detail', { selector: 'span' })).toBeInTheDocument()
  })

  it('steps through the gallery images', async () => {
    const user = renderAt('/products/3')
    expect(await screen.findByRole('img', { name: 'RCC Cement (1 of 2)' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Next image' }))
    expect(screen.getByRole('img', { name: 'RCC Cement (2 of 2)' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Next image' }))
    expect(screen.getByRole('img', { name: 'RCC Cement (1 of 2)' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Show image 2' }))
    expect(screen.getByRole('img', { name: 'RCC Cement (2 of 2)' })).toBeInTheDocument()
  })

  it('switches vendor tabs with the mouse and arrow keys', async () => {
    const user = renderAt('/products/3')
    await screen.findByText('RCC Cement')
    const tabs = screen.getByRole('tablist', { name: 'Vendors' })

    const assigned = within(tabs).getByRole('tab', { name: 'Vendor Assigned' })
    expect(assigned).toHaveAttribute('aria-selected', 'true')
    expect(
      screen.getByRole('heading', { name: 'Add Vendors to Expand Your Business Network' }),
    ).toBeInTheDocument()

    await user.click(within(tabs).getByRole('tab', { name: 'Assignment Request' }))
    expect(assigned).toHaveAttribute('aria-selected', 'false')

    await user.type(within(tabs).getByRole('tab', { name: 'Assignment Request' }), '{ArrowLeft}')
    expect(assigned).toHaveAttribute('aria-selected', 'true')
  })

  it('shows the API error with a way back', async () => {
    getMock.mockResolvedValue({ error: true, status: 404, message: 'Product not found' })
    renderAt('/products/99')
    expect(await screen.findByRole('alert')).toHaveTextContent('Product not found')
    expect(screen.getByRole('link', { name: 'Back to product list' })).toHaveAttribute(
      'href',
      '/products',
    )
  })

  it('does not call the API for an invalid id', () => {
    renderAt('/products/abc')
    expect(screen.getByRole('alert')).toHaveTextContent('This product does not exist.')
    expect(getMock).not.toHaveBeenCalled()
  })
})
