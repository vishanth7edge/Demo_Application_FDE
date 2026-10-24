import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import App from '../App.tsx'
import { saveToken, saveUsername } from '../helpers/tokenStorage.ts'
import { deleteProduct, listProducts, type Product } from '../services/productService.ts'

import type * as ProductService from '../services/productService.ts'

vi.mock('../services/productService.ts', async (importOriginal) => ({
  ...(await importOriginal<typeof ProductService>()),
  listProducts: vi.fn(),
  deleteProduct: vi.fn(),
}))

const listMock = vi.mocked(listProducts)
const deleteMock = vi.mocked(deleteProduct)

function makeProduct(id: number, title: string): Product {
  return {
    id,
    title,
    description: 'd',
    category: 'beauty',
    brand: 'Acme',
    price: 12,
    thumbnail: '',
    images: [],
    size: '',
  }
}

function renderProducts(): void {
  render(
    <MemoryRouter initialEntries={['/products']}>
      <App />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  localStorage.clear()
  saveToken('t')
  saveUsername('emilys')
  listMock.mockReset()
  deleteMock.mockReset()
  listMock.mockResolvedValue({
    error: false,
    data: { products: [makeProduct(1, 'Mascara'), makeProduct(2, 'Lipstick')], total: 25 },
  })
})

describe('ProductsPage', () => {
  it('lists products with the page range', async () => {
    renderProducts()
    expect(screen.getByRole('status')).toHaveTextContent('Loading products')
    expect(await screen.findByRole('link', { name: 'Mascara' })).toHaveAttribute(
      'href',
      '/products/1',
    )
    expect(screen.getByText('1-10 of 25')).toBeInTheDocument()
  })

  it('shows the empty state when nothing matches the search', async () => {
    const user = userEvent.setup()
    renderProducts()
    await screen.findByRole('link', { name: 'Mascara' })

    listMock.mockResolvedValue({ error: false, data: { products: [], total: 0 } })
    await user.type(screen.getByRole('searchbox', { name: 'Search products' }), 'zzz')

    expect(await screen.findByRole('heading', { name: 'No products yet' })).toBeInTheDocument()
    expect(listMock).toHaveBeenLastCalledWith({ query: 'zzz', page: 0 })
  })

  it('shows the error message when loading fails', async () => {
    listMock.mockResolvedValue({ error: true, message: 'Boom' })
    renderProducts()
    expect(await screen.findByRole('alert')).toHaveTextContent('Boom')
  })

  it('goes to the next page', async () => {
    const user = userEvent.setup()
    renderProducts()
    await screen.findByRole('link', { name: 'Mascara' })

    await user.click(screen.getByRole('button', { name: 'Next page' }))
    expect(await screen.findByText('11-20 of 25')).toBeInTheDocument()
    expect(listMock).toHaveBeenLastCalledWith({ query: '', page: 1 })
  })

  it('deletes a product only after confirmation', async () => {
    const user = userEvent.setup()
    deleteMock.mockResolvedValue({ error: false, data: { id: 1 } })
    renderProducts()
    await screen.findByRole('link', { name: 'Mascara' })

    await user.click(screen.getByRole('button', { name: 'Actions for Mascara' }))
    await user.click(screen.getByRole('menuitem', { name: 'Delete' }))
    const dialog = screen.getByRole('dialog', { name: 'Do you want to delete ?' })
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }))
    expect(deleteMock).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Actions for Mascara' }))
    await user.click(screen.getByRole('menuitem', { name: 'Delete' }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete' }))
    expect(deleteMock).toHaveBeenCalledWith(1)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(listMock).toHaveBeenCalledTimes(2)
  })

  it('opens the add product page', async () => {
    const user = userEvent.setup()
    renderProducts()
    await user.click(screen.getByRole('button', { name: 'Add Product' }))
    expect(await screen.findByRole('heading', { name: 'Upload Product Image' })).toBeInTheDocument()
  })
})
