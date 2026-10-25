import { API_URL, apiToken, expect, test, VIEWER } from '../support/fixtures.ts'

test.describe('API contract', () => {
  test('rejects unauthenticated requests with 401', async ({ request }) => {
    for (const path of [
      '/api/products',
      '/api/products/1',
      '/api/dashboard/summary',
      '/api/auth/me',
    ]) {
      const response = await request.get(`${API_URL}${path}`)
      expect(response.status(), path).toBe(401)
    }
  })

  test('validates product payloads on the server', async ({ request }) => {
    const token = await apiToken(request)
    const response = await request.post(`${API_URL}/api/products`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { name: 'x', sku: '!', category: 'Toys', price: 'free', quantity: -1, status: 'gone' },
    })
    expect(response.status()).toBe(400)
    const body = (await response.json()) as {
      error: { code: string; details: { field: string }[] }
    }
    expect(body.error.code).toBe('VALIDATION_ERROR')
    expect(body.error.details.map((detail) => detail.field).sort()).toEqual([
      'category',
      'name',
      'price',
      'quantity',
      'sku',
      'status',
    ])
  })

  test('rejects malformed JSON, unknown ids and bad list queries', async ({ request }) => {
    const headers = { Authorization: `Bearer ${await apiToken(request)}` }
    const malformed = await request.post(`${API_URL}/api/products`, {
      headers: { ...headers, 'Content-Type': 'application/json' },
      data: '{"name": ',
    })
    expect(malformed.status()).toBe(400)
    expect((await request.delete(`${API_URL}/api/products/9999`, { headers })).status()).toBe(404)
    expect((await request.get(`${API_URL}/api/products?pageSize=7`, { headers })).status()).toBe(
      400,
    )
  })

  test('only admins can change products', async ({ request }) => {
    const headers = { Authorization: `Bearer ${await apiToken(request, VIEWER)}` }
    expect((await request.get(`${API_URL}/api/products`, { headers })).status()).toBe(200)
    expect((await request.delete(`${API_URL}/api/products/1`, { headers })).status()).toBe(403)
    expect((await request.put(`${API_URL}/api/products/1`, { headers, data: {} })).status()).toBe(
      403,
    )
  })

  test('returns 201 on create and 204 on delete', async ({ request }) => {
    const headers = { Authorization: `Bearer ${await apiToken(request)}` }
    const created = await request.post(`${API_URL}/api/products`, {
      headers,
      data: {
        name: 'Canvas Tote',
        sku: 'ap-5100',
        category: 'Apparel',
        price: 12,
        quantity: 3,
        status: 'active',
      },
    })
    expect(created.status()).toBe(201)
    const product = (await created.json()) as { id: number; sku: string }
    expect(product.sku).toBe('AP-5100')
    expect(
      (await request.delete(`${API_URL}/api/products/${String(product.id)}`, { headers })).status(),
    ).toBe(204)
  })
})
