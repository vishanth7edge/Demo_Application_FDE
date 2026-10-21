import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getToken } from '../helpers/tokenStorage.ts'
import { login, signup } from './authService.ts'

const fetchMock = vi.fn<typeof fetch>()

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function sentBody(init: RequestInit | undefined): unknown {
  return typeof init?.body === 'string' ? JSON.parse(init.body) : null
}

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  vi.stubEnv('VITE_API_BASE_URL', 'https://api.test/')
})

afterEach(() => {
  fetchMock.mockReset()
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
  localStorage.clear()
})

describe('login', () => {
  it('posts credentials to /auth/login and saves the token', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ id: 1, username: 'emilys', accessToken: 'tok', refreshToken: 'r' }),
    )

    const result = await login({ username: 'emilys', password: 'pw' })

    expect(result).toEqual({
      error: false,
      data: { id: 1, username: 'emilys', accessToken: 'tok' },
    })
    expect(getToken()).toBe('tok')

    const [url, init] = fetchMock.mock.calls[0] ?? []
    expect(url).toBe('https://api.test/auth/login')
    expect(init?.method).toBe('POST')
    expect(sentBody(init)).toEqual({
      username: 'emilys',
      password: 'pw',
      expiresInMins: 30,
    })
  })

  it('returns the API message and saves nothing on a 400', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ message: 'Invalid credentials' }, 400))

    const result = await login({ username: 'x', password: 'y' })

    expect(result).toEqual({ error: true, status: 400, message: 'Invalid credentials' })
    expect(getToken()).toBeNull()
  })

  it('reports a network failure', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))

    const result = await login({ username: 'x', password: 'y' })

    expect(result).toMatchObject({ error: true })
    expect(getToken()).toBeNull()
  })

  it('rejects a response without a token', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: 1, username: 'emilys' }))

    expect(await login({ username: 'emilys', password: 'pw' })).toMatchObject({ error: true })
    expect(getToken()).toBeNull()
  })

  it('fails clearly when VITE_API_BASE_URL is not set', async () => {
    vi.stubEnv('VITE_API_BASE_URL', '')

    const result = await login({ username: 'x', password: 'y' })

    expect(result).toEqual({ error: true, message: 'VITE_API_BASE_URL is not set' })
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('signup', () => {
  it('posts the new user to /users/add', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: 209, email: 'ada@example.com' }, 201))

    const result = await signup({ name: 'Ada', email: 'ada@example.com', password: 'abcdefg1' })

    expect(result).toEqual({ error: false, data: { id: 209, email: 'ada@example.com' } })
    const [url, init] = fetchMock.mock.calls[0] ?? []
    expect(url).toBe('https://api.test/users/add')
    expect(sentBody(init)).toEqual({
      firstName: 'Ada',
      email: 'ada@example.com',
      password: 'abcdefg1',
    })
  })
})
