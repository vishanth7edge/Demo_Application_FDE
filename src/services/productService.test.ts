import { beforeEach, describe, expect, it, vi } from 'vitest'

import { EMPTY_PRODUCT_VALUES } from '../helpers/validators.ts'
import {
  addProduct,
  buildProductFormData,
  deleteProduct,
  getProduct,
  productToFormValues,
  updateProduct,
} from './productService.ts'

const fetchMock = vi.fn<typeof fetch>()

beforeEach(() => {
  vi.stubEnv('VITE_API_BASE_URL', 'https://api.test')
  vi.stubGlobal('fetch', fetchMock)
  fetchMock.mockReset()
})

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status })
}

function lastCall(): { url: string; init: RequestInit } {
  const call = fetchMock.mock.lastCall
  if (call === undefined || typeof call[0] !== 'string') {
    throw new Error('fetch was not called with a URL string')
  }
  return { url: call[0], init: call[1] ?? {} }
}

describe('getProduct', () => {
  it('maps the DummyJSON product', async () => {
    fetchMock.mockResolvedValue(
      json({
        id: 1,
        title: 'Essence Mascara',
        description: 'Mascara',
        category: 'beauty',
        price: 9.99,
        thumbnail: 'https://cdn.test/1.webp',
        brand: 'Essence',
        images: ['https://cdn.test/1a.webp', 42],
        dimensions: { width: 23.17, height: 14.43, depth: 28.01 },
      }),
    )

    const result = await getProduct(1)

    expect(lastCall().url).toBe('https://api.test/products/1')
    expect(result).toEqual({
      error: false,
      data: {
        id: 1,
        title: 'Essence Mascara',
        description: 'Mascara',
        category: 'beauty',
        price: 9.99,
        thumbnail: 'https://cdn.test/1.webp',
        brand: 'Essence',
        images: ['https://cdn.test/1a.webp'],
        size: '23.17 × 14.43 × 28.01',
      },
    })
  })

  it('passes the 404 through', async () => {
    fetchMock.mockResolvedValue(json({ message: "Product with id '9999' not found" }, 404))

    expect(await getProduct(9999)).toEqual({
      error: true,
      status: 404,
      message: "Product with id '9999' not found",
    })
  })
})

describe('addProduct / updateProduct', () => {
  it('POSTs FormData without setting Content-Type', async () => {
    fetchMock.mockResolvedValue(json({ id: 195, title: 'RCC Cement' }, 201))
    const data = new FormData()
    data.append('title', 'RCC Cement')

    expect(await addProduct(data)).toEqual({ error: false, data: { id: 195 } })
    const { url, init } = lastCall()
    expect(url).toBe('https://api.test/products/add')
    expect(init.method).toBe('POST')
    expect(init.body).toBe(data)
    expect(new Headers(init.headers).has('Content-Type')).toBe(false)
  })

  it('PUTs FormData to /products/:id', async () => {
    fetchMock.mockResolvedValue(json({ id: 7, title: 'x' }))

    expect(await updateProduct(7, new FormData())).toEqual({ error: false, data: { id: 7 } })
    expect(lastCall().url).toBe('https://api.test/products/7')
    expect(lastCall().init.method).toBe('PUT')
  })

  it('returns the API error', async () => {
    fetchMock.mockResolvedValue(json({ message: 'Server down' }, 500))

    expect(await addProduct(new FormData())).toEqual({
      error: true,
      status: 500,
      message: 'Server down',
    })
  })
})

describe('buildProductFormData', () => {
  it('maps form fields, skips empty optional ones and adds each image', () => {
    const image = new File(['img'], 'cement.png', { type: 'image/png' })
    const data = buildProductFormData(
      {
        ...EMPTY_PRODUCT_VALUES,
        name: ' RCC Cement ',
        category: 'construction',
        ratePerUnit: '200',
        form: 'powder',
        ecoFriendly: true,
      },
      [image, new Blob(['x'], { type: 'image/webp' })],
    )

    expect(data.get('title')).toBe('RCC Cement')
    expect(data.get('category')).toBe('construction')
    expect(data.get('price')).toBe('200')
    expect(data.get('form')).toBe('powder')
    expect(data.get('ecoFriendly')).toBe('true')
    expect(data.get('handleWithCare')).toBe('false')
    expect(data.has('description')).toBe(false)
    expect(data.has('productColor')).toBe(false)
    const sent = data.getAll('images').map((entry) => (entry instanceof File ? entry.name : null))
    expect(sent).toEqual(['cement.png', 'product-image-2'])
  })

  it('leaves images out when none were picked', () => {
    expect(buildProductFormData(EMPTY_PRODUCT_VALUES, []).has('images')).toBe(false)
  })
})

describe('deleteProduct', () => {
  it('sends DELETE /products/:id', async () => {
    fetchMock.mockResolvedValue(json({ id: 3, title: 'Chair', isDeleted: true }))

    expect(await deleteProduct(3)).toEqual({ error: false, data: { id: 3 } })
    expect(lastCall().url).toBe('https://api.test/products/3')
    expect(lastCall().init.method).toBe('DELETE')
  })
})

describe('productToFormValues', () => {
  it('pre-fills the fields DummyJSON has', () => {
    expect(
      productToFormValues({
        id: 1,
        title: 'Mascara',
        description: 'Long lashes',
        category: 'beauty',
        price: 9.99,
        thumbnail: '',
        brand: '',
        images: [],
        size: '',
      }),
    ).toEqual({
      name: 'Mascara',
      category: 'beauty',
      description: 'Long lashes',
      ratePerUnit: '9.99',
    })
  })
})
