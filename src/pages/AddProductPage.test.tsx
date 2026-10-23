import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AppProviders } from '../AppProviders.tsx'
import { saveToken } from '../helpers/tokenStorage.ts'
import { ROUTES } from '../routes.ts'

const ME = {
  id: 1,
  username: 'emilys',
  email: 'e@x.com',
  firstName: 'Emily',
  lastName: 'Johnson',
  image: '',
}

const fetchMock = vi.fn<typeof fetch>()
let addResponse: () => Promise<Response>

beforeEach(() => {
  vi.stubEnv('VITE_API_BASE_URL', 'https://api.test')
  vi.stubGlobal('fetch', fetchMock)
  Object.defineProperty(URL, 'createObjectURL', { value: () => 'blob:preview', configurable: true })
  Object.defineProperty(URL, 'revokeObjectURL', { value: () => undefined, configurable: true })
  saveToken('access-token')
  addResponse = () => Promise.resolve(new Response(JSON.stringify({ id: 195 }), { status: 201 }))
  fetchMock.mockReset().mockImplementation((input) => {
    const url = typeof input === 'string' ? input : ''
    if (url.endsWith('/auth/me')) {
      return Promise.resolve(new Response(JSON.stringify(ME)))
    }
    return addResponse()
  })
})

function addCalls(): RequestInit[] {
  return fetchMock.mock.calls
    .filter(([input]) => typeof input === 'string' && input.endsWith('/products/add'))
    .map(([, init]) => init ?? {})
}

async function renderAddPage(): Promise<ReturnType<typeof userEvent.setup>> {
  const user = userEvent.setup({ applyAccept: false })
  const router = createMemoryRouter(ROUTES, { initialEntries: ['/products/new'] })
  render(
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>,
  )
  await screen.findByRole('heading', { level: 1, name: 'Add product', hidden: true })
  return user
}

async function fillRequired(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  await user.type(screen.getByLabelText('Product Name'), 'RCC Cement')
  await user.selectOptions(screen.getByLabelText('Product Category'), 'construction')
  await user.type(screen.getByLabelText('Rate per Unit'), '200')
}

describe('AddProductPage', () => {
  it('is reached from the products page', async () => {
    const user = userEvent.setup()
    render(
      <AppProviders>
        <RouterProvider router={createMemoryRouter(ROUTES, { initialEntries: ['/products'] })} />
      </AppProviders>,
    )
    await user.click(await screen.findByRole('link', { name: 'Add Product' }))
    expect(await screen.findByLabelText('Product Name')).toBeInTheDocument()
  })

  it('shows field errors and sends nothing when required fields are empty', async () => {
    const user = await renderAddPage()

    await user.click(screen.getByRole('button', { name: 'Add Product' }))

    expect(screen.getByText('Product name is required')).toBeInTheDocument()
    expect(screen.getByText('Choose a product category')).toBeInTheDocument()
    expect(screen.getByText('Rate per unit is required')).toBeInTheDocument()
    expect(addCalls()).toHaveLength(0)
  })

  it('sends FormData with the image, shows "Saving…", then returns to /products', async () => {
    let respond: (response: Response) => void = () => undefined
    addResponse = () =>
      new Promise((resolve) => {
        respond = resolve
      })
    const user = await renderAddPage()
    await fillRequired(user)
    const image = new File(['img'], 'cement.png', { type: 'image/png' })
    await user.upload(screen.getByTestId('product-image-input'), image)

    await user.click(screen.getByRole('button', { name: 'Add Product' }))

    expect(screen.getByRole('button', { name: 'Saving…' })).toBeDisabled()
    const [init] = addCalls()
    expect(init?.method).toBe('POST')
    const body = init?.body
    expect(body).toBeInstanceOf(FormData)
    const data = body instanceof FormData ? body : new FormData()
    expect(data.get('title')).toBe('RCC Cement')
    expect(data.get('price')).toBe('200')
    // FormData stores a copy of the blob, so compare its name and type.
    const sentImage = data.get('images')
    expect(sentImage).toBeInstanceOf(File)
    expect(sentImage instanceof File ? [sentImage.name, sentImage.type] : null).toEqual([
      image.name,
      image.type,
    ])
    expect(new Headers(init?.headers).has('Content-Type')).toBe(false)

    respond(new Response(JSON.stringify({ id: 195 }), { status: 201 }))

    expect(
      await screen.findByRole('dialog', { name: 'Product Added Successfully' }),
    ).toHaveTextContent('id 195')
    expect(screen.getByRole('heading', { level: 1, name: 'Product List' })).toBeInTheDocument()
  })

  it('shows the error and keeps what was typed when saving fails', async () => {
    addResponse = () =>
      Promise.resolve(new Response(JSON.stringify({ message: 'Server down' }), { status: 500 }))
    const user = await renderAddPage()
    await fillRequired(user)

    await user.click(screen.getByRole('button', { name: 'Add Product' }))

    const form = screen.getByLabelText('Product Name').closest('form')
    expect(await within(form ?? document.body).findByRole('alert')).toHaveTextContent('Server down')
    expect(screen.getByLabelText('Product Name')).toHaveValue('RCC Cement')
    expect(screen.getByLabelText('Rate per Unit')).toHaveValue('200')
    expect(screen.getByRole('button', { name: 'Add Product' })).toBeEnabled()
  })
})
