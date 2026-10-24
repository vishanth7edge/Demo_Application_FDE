import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import App from '../App.tsx'
import { saveToken, saveUsername } from '../helpers/tokenStorage.ts'
import { addProduct } from '../services/productService.ts'
import type * as ProductService from '../services/productService.ts'

vi.mock('../services/productService.ts', async (importOriginal) => ({
  ...(await importOriginal<typeof ProductService>()),
  addProduct: vi.fn(),
  listProducts: vi.fn().mockResolvedValue({ error: false, data: { products: [], total: 0 } }),
}))

const addMock = vi.mocked(addProduct)

function renderForm(): ReturnType<typeof userEvent.setup> {
  render(
    <MemoryRouter initialEntries={['/products/new']}>
      <App />
    </MemoryRouter>,
  )
  return userEvent.setup()
}

async function fillValidForm(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  await user.type(screen.getByLabelText('Product Name'), 'RCC Cement')
  await user.selectOptions(screen.getByLabelText('Product Category'), 'Construction')
  await user.type(screen.getByLabelText('Product Description'), 'Grey powder')
  await user.selectOptions(screen.getByLabelText('Form'), 'Powder')
  await user.selectOptions(screen.getByLabelText('Safety'), 'Flammable')
  await user.selectOptions(screen.getByLabelText('UOM'), 'Per Unit')
  await user.type(screen.getByLabelText('Rate per Unit'), '200')
  await user.type(screen.getByLabelText('Market Selling Price'), '300')
}

beforeEach(() => {
  localStorage.clear()
  saveToken('t')
  saveUsername('emilys')
  addMock.mockReset()
  vi.stubGlobal(
    'URL',
    Object.assign(URL, { createObjectURL: () => 'blob:x', revokeObjectURL: vi.fn() }),
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('AddProductPage', () => {
  it('shows breadcrumbs and required-field errors without calling the API', async () => {
    const user = renderForm()
    expect(screen.getByRole('link', { name: 'Product List' })).toHaveAttribute('href', '/products')

    await user.click(screen.getByRole('button', { name: 'Add Product' }))

    expect(screen.getByText('Product name is required')).toBeInTheDocument()
    expect(screen.getByText('Rate per unit is required')).toBeInTheDocument()
    expect(addMock).not.toHaveBeenCalled()
  })

  it('calculates the sale profit margin from the two prices', async () => {
    const user = renderForm()
    await user.type(screen.getByLabelText('Rate per Unit'), '200')
    await user.type(screen.getByLabelText('Market Selling Price'), '300')
    expect(screen.getByLabelText('Sale Profit Margin')).toHaveValue('50%')
  })

  it('adds the product and shows the success dialog, then goes home', async () => {
    addMock.mockResolvedValue({ error: false, data: { id: 195 } })
    const user = renderForm()
    await fillValidForm(user)

    await user.click(screen.getByRole('button', { name: 'Add Product' }))

    expect(addMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'RCC Cement', category: 'Construction', price: 200 }),
    )
    const dialog = await screen.findByRole('dialog', { name: 'Product Added Successfully' })
    await user.click(within(dialog).getByRole('button', { name: 'Home' }))
    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument()
  })

  it('shows the API error and keeps the form', async () => {
    addMock.mockResolvedValue({ error: true, message: 'Server said no' })
    const user = renderForm()
    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: 'Add Product' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Server said no')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('keeps a saved draft for the next visit', async () => {
    const user = renderForm()
    await user.type(screen.getByLabelText('Product Name'), 'Draft cement')
    await user.click(screen.getByRole('button', { name: 'Save as draft' }))
    expect(screen.getByRole('status')).toHaveTextContent('Draft saved')

    render(
      <MemoryRouter initialEntries={['/products/new']}>
        <App />
      </MemoryRouter>,
    )
    expect(screen.getAllByLabelText('Product Name')[1]).toHaveValue('Draft cement')
  })

  it('uploads an image, then removes it through the attention dialog', async () => {
    const user = renderForm()
    const file = new File(['x'], 'bag.png', { type: 'image/png' })
    await user.upload(screen.getByLabelText('Upload product picture'), file)

    await user.click(screen.getByRole('button', { name: 'Change image bag.png' }))
    const dialog = screen.getByRole('dialog', { name: 'Attention !' })
    await user.click(within(dialog).getByRole('button', { name: 'Remove' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Upload product picture')).toBeInTheDocument()
  })

  it('rejects a brochure that is not a PDF', async () => {
    renderForm()
    const file = new File(['x'], 'notes.txt', { type: 'text/plain' })
    await userEvent
      .setup({ applyAccept: false })
      .upload(screen.getByLabelText('Upload product brochure'), file)
    expect(screen.getByRole('alert')).toHaveTextContent('The brochure must be a PDF file')
  })

  it('shows an accepted brochure with a remove button', async () => {
    const user = renderForm()
    const file = new File(['x'], 'spec.pdf', { type: 'application/pdf' })
    await user.upload(screen.getByLabelText('Upload product brochure'), file)
    expect(screen.getByText('spec.pdf')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Remove brochure' }))
    expect(screen.queryByText('spec.pdf')).not.toBeInTheDocument()
  })
})
