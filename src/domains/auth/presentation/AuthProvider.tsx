import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

import {
  fetchCurrentSession,
  hasStoredSession,
  signInRequest,
  signOutRequest,
  subscribeToSessionEnd,
} from '../application/index.ts'
import type { AuthSession, AuthUser, LoginInput } from '../application/index.ts'
import type { ApiResult } from '../../../shared/api/apiClient.ts'
import { AuthContext } from './AuthContext.ts'
import type { AuthContextValue, AuthStatus } from './AuthContext.ts'

export interface AuthProviderProps {
  children: ReactNode
}

interface AuthState {
  status: AuthStatus
  user: AuthUser | null
}

const ANONYMOUS: AuthState = { status: 'anonymous', user: null }
const SIGNED_OUT_NOTICE = "You've been signed out."

export function AuthProvider({ children }: AuthProviderProps): React.JSX.Element {
  const [restoreSession] = useState(hasStoredSession)
  const [state, setState] = useState<AuthState>(
    restoreSession ? { status: 'checking', user: null } : ANONYMOUS,
  )
  const [notice, setNotice] = useState<string | null>(null)

  // Restore the session from a stored token on first load / refresh.
  useEffect(() => {
    if (!restoreSession) {
      return undefined
    }
    let ignore = false
    void fetchCurrentSession().then((result) => {
      if (!ignore) {
        setState(result.error ? ANONYMOUS : { status: 'authenticated', user: result.data.user })
      }
    })
    return () => {
      ignore = true
    }
  }, [restoreSession])

  // Any authenticated request that comes back 401 signs the user out here.
  useEffect(() => {
    subscribeToSessionEnd((message) => {
      setState(ANONYMOUS)
      setNotice(message)
    })
    return () => {
      subscribeToSessionEnd(null)
    }
  }, [])

  const signIn = useCallback(async (input: LoginInput): Promise<ApiResult<AuthSession>> => {
    const result = await signInRequest(input)
    if (!result.error) {
      setNotice(null)
      setState({ status: 'authenticated', user: result.data.user })
    }
    return result
  }, [])

  // RequireAuth then redirects to /login, where the notice is shown.
  const signOut = useCallback(async (): Promise<void> => {
    await signOutRequest()
    setNotice(SIGNED_OUT_NOTICE)
    setState(ANONYMOUS)
  }, [])

  const clearNotice = useCallback((): void => {
    setNotice(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({ status: state.status, user: state.user, notice, signIn, signOut, clearNotice }),
    [state, notice, signIn, signOut, clearNotice],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}
