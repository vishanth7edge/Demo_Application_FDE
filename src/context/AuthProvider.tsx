import { useCallback, useEffect, useMemo, useState } from 'react'

import { clearToken, getToken, saveToken } from '../helpers/tokenStorage.ts'
import { getCurrentUser, login as loginRequest } from '../services/authService.ts'
import { AuthContext } from './AuthContext.ts'

import type { AuthUser, LoginInput } from '../services/authService.ts'
import type { ApiResult } from '../shared/httpClient.ts'
import type { AuthContextValue } from './AuthContext.ts'

type AuthState =
  | { status: 'restoring'; user: null }
  | { status: 'authenticated'; user: AuthUser }
  | { status: 'anonymous'; user: null }

export interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps): React.JSX.Element {
  const [state, setState] = useState<AuthState>(() =>
    getToken() === null ? { status: 'anonymous', user: null } : { status: 'restoring', user: null },
  )

  // Restore the session from a saved token (page reload).
  useEffect(() => {
    const token = getToken()
    if (token === null) {
      return
    }
    let cancelled = false
    void getCurrentUser().then((result) => {
      if (cancelled) {
        return
      }
      if (result.error && getToken() === token) {
        clearToken()
      }
      // A login or logout that finished first wins.
      setState((current) => {
        if (current.status !== 'restoring') {
          return current
        }
        return result.error
          ? { status: 'anonymous', user: null }
          : { status: 'authenticated', user: result.data }
      })
    })
    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (input: LoginInput): Promise<ApiResult<AuthUser>> => {
    const result = await loginRequest(input)
    if (result.error) {
      return result
    }
    saveToken(result.data.accessToken)
    setState({ status: 'authenticated', user: result.data.user })
    return { error: false, data: result.data.user }
  }, [])

  const logout = useCallback((): void => {
    clearToken()
    setState({ status: 'anonymous', user: null })
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({ status: state.status, user: state.user, login, logout }),
    [state, login, logout],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}
