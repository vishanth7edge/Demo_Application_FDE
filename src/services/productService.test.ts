import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { addProduct, deleteProduct, getProduct, listProducts } from './productService.ts'

const fetchMock = vi.fn<typeof fetch>()

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

const rawProduct = {
  id: 3,
  title: 'Cement',
  price: 9.5,
  description: 'Grey',
  category: 'construction',
  brand: 'Saudi',
  thumbnail: 'https://img/t.png',
  images: ['https://img/1.png', 7],
  dimensions: { width: 12, height: 12, depth: 12 },
}

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  vi.stubEnv('VITE_API_BASE_URL', 'https://api.test/')
})

afterEach(() => {
  fetchMock.mockReset()
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe('listProducts', () => {
  it('requests one page and parses products', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ products: [rawProduct], total: 40 }))

    const result = await listProducts({ query: '', page: 2 })

    expect(fetchMock.mock.calls[0]?.[0]).toBe('https://api.test/products?limit=10&skip=20')
    expect(result).toEqual({
      error: false,
      data: {
        total: 40,
        products: [
          {
            id: 3,
            title: 'Cement',
            price: 9.5,
            description: 'Grey',
            category: 'construction',
            brand: 'Saudi',
            thumbnail: 'https://img/t.png',
            images: ['https://img/1.png'],
            size: '12*12*12',
          },
        ],
      },
    })
  })

  it('uses the search endpoint for a non-empty query', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ products: [], total: 0 }))
    await listProducts({ query: ' red cap ', page: 0 })
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      'https://api.test/products/search?q=red%20cap&limit=10&skip=0',
    )
  })

  it('fails on an unexpected body', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ products: [{ id: 'x' }], total: 1 }))
    expect((await listProducts({ query: '', page: 0 })).error).toBe(true)
  })
})

describe('getProduct, deleteProduct and addProduct', () => {
  it('gets one product', async () => {
    fetchMock.mockResolvedValue(jsonResponse(rawProduct))
    const result = await getProduct(3)
    expect(fetchMock.mock.calls[0]?.[0]).toBe('https://api.test/products/3')
    expect(result.error).toBe(false)
  })

  it('returns the API message when a product is missing', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ message: 'Product with id 99 not found' }, 404))
    expect(await getProduct(99)).toEqual({
      error: true,
      status: 404,
      message: 'Product with id 99 not found',
    })
  })

  it('deletes with the DELETE method', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: 3, isDeleted: true }))
    await deleteProduct(3)
    expect(fetchMock.mock.calls[0]?.[1]?.method).toBe('DELETE')
  })

  it('posts a new product as JSON', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: 195 }, 201))
    const input = {
      title: 'Cement',
      description: 'd',
      category: 'c',
      price: 200,
      ecoFriendly: true,
    }
    expect(await addProduct(input)).toEqual({ error: false, data: { id: 195 } })
    const init = fetchMock.mock.calls[0]?.[1]
    expect(init?.method).toBe('POST')
    expect(init?.body).toBe(JSON.stringify(input))
  })
})
