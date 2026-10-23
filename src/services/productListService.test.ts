import { beforeEach, describe, expect, it, vi } from 'vitest'

import { listCategories, listProducts, productListPath } from './productListService.ts'

const fetchMock = vi.fn<typeof fetch>()

beforeEach(() => {
  vi.stubEnv('VITE_API_BASE_URL', 'https://api.test')
  vi.stubGlobal('fetch', fetchMock)
  fetchMock.mockReset()
})

function json(body: unknown): Response {
  return new Response(JSON.stringify(body))
}

const FIELDS = 'select=title,brand,category,price,thumbnail'

describe('productListPath', () => {
  it.each([
    [{ search: '', category: '', page: 1 }, `/products?limit=10&skip=0&${FIELDS}`],
    [{ search: '', category: '', page: 3 }, `/products?limit=10&skip=20&${FIELDS}`],
    [
      { search: ' red chair ', category: '', page: 2 },
      `/products/search?q=red%20chair&limit=10&skip=10&${FIELDS}`,
    ],
    [
      { search: 'chair', category: 'home-decoration', page: 2 },
      `/products/category/home-decoration?limit=0&${FIELDS}`,
    ],
  ])('%o → %s', (input, path) => {
    expect(productListPath(input)).toBe(path)
  })
})

describe('listProducts', () => {
  it('returns the page and the total', async () => {
    fetchMock.mockResolvedValue(
      json({ products: [{ id: 1, title: 'Chair', price: 50 }], total: 194, skip: 0, limit: 10 }),
    )

    const result = await listProducts({ search: '', category: '', page: 1 })

    expect(result.error).toBe(false)
    expect(result.error ? null : result.data.total).toBe(194)
    expect(result.error ? null : result.data.products.map((p) => p.title)).toEqual(['Chair'])
  })

  it('searches and pages inside a category itself', async () => {
    const products = Array.from({ length: 13 }, (_, i) => ({
      id: i + 1,
      title: i % 2 === 0 ? `Chair ${String(i)}` : `Lamp ${String(i)}`,
    }))
    fetchMock.mockImplementation(() => Promise.resolve(json({ products, total: 13 })))

    const result = await listProducts({ search: 'chair', category: 'furniture', page: 1 })

    expect(result.error ? null : result.data.total).toBe(7)
    expect(result.error ? null : result.data.products).toHaveLength(7)
    const page2 = await listProducts({ search: '', category: 'furniture', page: 2 })
    expect(page2.error ? null : page2.data.products.map((p) => p.id)).toEqual([11, 12, 13])
  })

  it('rejects an unexpected body', async () => {
    fetchMock.mockResolvedValue(json({ items: [] }))
    expect((await listProducts({ search: '', category: '', page: 1 })).error).toBe(true)
  })
})

describe('listCategories', () => {
  it('returns the slugs', async () => {
    fetchMock.mockResolvedValue(json(['beauty', 'furniture', 3]))
    expect(await listCategories()).toEqual({ error: false, data: ['beauty', 'furniture'] })
    expect(fetchMock.mock.lastCall?.[0]).toBe('https://api.test/products/category-list')
  })
})
