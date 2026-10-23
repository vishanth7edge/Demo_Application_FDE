import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getToken } from '../helpers/tokenStorage.ts'
import { NETWORK_ERROR_MESSAGE } from '../shared/httpClient.ts'
import { getCurrentUser, login, signup } from './authService.ts'

const LOGIN_RESPONSE = {
  id: 1,
  username: 'emilys',
  email: 'emily@example.com',
  firstName: 'Emily',
  lastName: 'Johnson',
  gender: 'female',
  image: 'https://dummyjson.com/icon/emilys/128',
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

const fetchMock = vi.fn<typeof fetch>()

beforeEach(() => {
  vi.stubEnv('VITE_API_BASE_URL', 'https://api.test/')
  vi.stubGlobal('fetch', fetchMock)
  fetchMock.mockReset()
})

function lastRequest(): { url: string; init: RequestInit; body: unknown } {
  const call = fetchMock.mock.lastCall
  if (call === undefined) {
    throw new Error('fetch was not called')
  }
  const [url, init = {}] = call
  if (typeof url !== 'string' || typeof init.body !== 'string') {
    throw new Error('expected a string URL and a JSON string body')
  }
  const body: unknown = JSON.parse(init.body)
  return { url, init, body }
}

describe('login', () => {
  it('posts the credentials to /auth/login and returns the user and tokens', async () => {
    fetchMock.mockResolvedValue(jsonResponse(LOGIN_RESPONSE))

    const result = await login({ username: ' emilys ', password: 'emilyspass' })

    const { url, init, body } = lastRequest()
    expect(url).toBe('https://api.test/auth/login')
    expect(init.method).toBe('POST')
    expect(body).toEqual({ username: 'emilys', password: 'emilyspass' })
    expect(result).toEqual({
      error: false,
      data: {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: {
          id: 1,
          username: 'emilys',
          email: 'emily@example.com',
          firstName: 'Emily',
          lastName: 'Johnson',
          image: 'https://dummyjson.com/icon/emilys/128',
        },
      },
    })
    // Storing the token is AuthContext's job.
    expect(getToken()).toBeNull()
  })

  it('returns the API message on invalid credentials and saves nothing', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ message: 'Invalid credentials' }, 400))

    const result = await login({ username: 'emilys', password: 'wrong' })

    expect(result).toEqual({ error: true, status: 400, message: 'Invalid credentials' })
    expect(getToken()).toBeNull()
  })

  it('falls back to a generic message when the error body is not JSON', async () => {
    fetchMock.mockResolvedValue(new Response('Bad gateway', { status: 502 }))

    expect(await login({ username: 'emilys', password: 'x' })).toEqual({
      error: true,
      status: 502,
      message: 'Request failed (502)',
    })
  })

  it('reports network failures', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))

    expect(await login({ username: 'emilys', password: 'x' })).toEqual({
      error: true,
      message: NETWORK_ERROR_MESSAGE,
    })
  })

  it('rejects a success response without a token', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ...LOGIN_RESPONSE, accessToken: undefined }))

    const result = await login({ username: 'emilys', password: 'emilyspass' })

    expect(result).toEqual({ error: true, message: 'Unexpected response from the server' })
  })

  it('sends a saved token as a bearer header', async () => {
    localStorage.setItem('authToken', 'old-token')
    fetchMock.mockResolvedValue(jsonResponse(LOGIN_RESPONSE))

    await login({ username: 'emilys', password: 'emilyspass' })

    const headers = new Headers(lastRequest().init.headers)
    expect(headers.get('Authorization')).toBe('Bearer old-token')
  })

  it('fails without calling fetch when VITE_API_BASE_URL is missing', async () => {
    vi.stubEnv('VITE_API_BASE_URL', '')

    expect(await login({ username: 'emilys', password: 'x' })).toEqual({
      error: true,
      message: 'VITE_API_BASE_URL is not set',
    })
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('getCurrentUser', () => {
  it('fetches /auth/me with the saved token', async () => {
    localStorage.setItem('authToken', 'access-token')
    fetchMock.mockResolvedValue(jsonResponse(LOGIN_RESPONSE))

    const result = await getCurrentUser()

    const call = fetchMock.mock.lastCall
    expect(call?.[0]).toBe('https://api.test/auth/me')
    const init = call?.[1]
    expect(init?.method).toBe('GET')
    expect(new Headers(init?.headers).get('Authorization')).toBe('Bearer access-token')
    expect(result).toEqual({
      error: false,
      data: {
        id: 1,
        username: 'emilys',
        email: 'emily@example.com',
        firstName: 'Emily',
        lastName: 'Johnson',
        image: 'https://dummyjson.com/icon/emilys/128',
      },
    })
  })

  it('returns the 401 for an expired token', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ message: 'Invalid/Expired Token!' }, 401))

    expect(await getCurrentUser()).toEqual({
      error: true,
      status: 401,
      message: 'Invalid/Expired Token!',
    })
  })
})

describe('signup', () => {
  it('trims the names and posts to /users/add', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        {
          id: 209,
          firstName: 'Alice',
          lastName: 'Van Smith',
          email: 'alice@example.com',
          password: 'abcd1234',
        },
        201,
      ),
    )

    const result = await signup({
      firstName: '  Alice ',
      lastName: 'Van Smith ',
      email: 'alice@example.com',
      password: 'abcd1234',
    })

    const { url, body } = lastRequest()
    expect(url).toBe('https://api.test/users/add')
    expect(body).toEqual({
      firstName: 'Alice',
      lastName: 'Van Smith',
      email: 'alice@example.com',
      password: 'abcd1234',
    })
    // The echoed password is not passed on.
    expect(result).toEqual({
      error: false,
      data: { id: 209, firstName: 'Alice', lastName: 'Van Smith', email: 'alice@example.com' },
    })
  })

  it('returns the API error', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ message: 'Email already exists' }, 400))

    expect(
      await signup({
        firstName: 'Alice',
        lastName: 'Smith',
        email: 'alice@example.com',
        password: 'abcd1234',
      }),
    ).toEqual({ error: true, status: 400, message: 'Email already exists' })
  })
})
