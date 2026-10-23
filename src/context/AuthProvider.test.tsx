import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getToken, saveToken } from '../helpers/tokenStorage.ts'
import { AuthProvider } from './AuthProvider.tsx'
import { useAuth } from './useAuth.ts'

import type { AuthContextValue } from './AuthContext.ts'

const USER = {
  id: 1,
  username: 'emilys',
  email: 'emily@example.com',
  firstName: 'Emily',
  lastName: 'Johnson',
  image: 'https://dummyjson.com/icon/emilys/128',
}

const fetchMock = vi.fn<typeof fetch>()

beforeEach(() => {
  vi.stubEnv('VITE_API_BASE_URL', 'https://api.test')
  vi.stubGlobal('fetch', fetchMock)
  fetchMock.mockReset()
})

function renderAuth(): { result: { current: AuthContextValue } } {
  return renderHook(() => useAuth(), { wrapper: AuthProvider })
}

describe('AuthProvider', () => {
  it('starts anonymous without a saved token', () => {
    const { result } = renderAuth()

    expect(result.current.status).toBe('anonymous')
    expect(result.current.user).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('login saves the token and sets the user', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ ...USER, accessToken: 'access', refreshToken: 'refresh' })),
    )
    const { result } = renderAuth()

    let outcome: Awaited<ReturnType<AuthContextValue['login']>> | undefined
    await act(async () => {
      outcome = await result.current.login({ username: 'emilys', password: 'emilyspass' })
    })

    expect(outcome).toEqual({ error: false, data: USER })
    expect(result.current.status).toBe('authenticated')
    expect(result.current.user).toEqual(USER)
    expect(getToken()).toBe('access')
  })

  it('a failed login leaves the user logged out', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ message: 'Invalid credentials' }), { status: 400 }),
    )
    const { result } = renderAuth()

    await act(async () => {
      await result.current.login({ username: 'emilys', password: 'wrong' })
    })

    expect(result.current.status).toBe('anonymous')
    expect(getToken()).toBeNull()
  })

  it('logout clears the token and the user', async () => {
    saveToken('access')
    fetchMock.mockResolvedValue(new Response(JSON.stringify(USER)))
    const { result } = renderAuth()
    await waitFor(() => {
      expect(result.current.status).toBe('authenticated')
    })

    act(() => {
      result.current.logout()
    })

    expect(result.current.status).toBe('anonymous')
    expect(result.current.user).toBeNull()
    expect(getToken()).toBeNull()
  })

  it('throws a clear error outside the provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)

    expect(() => renderHook(() => useAuth())).toThrow('useAuth must be used inside <AuthProvider>')
  })
})
