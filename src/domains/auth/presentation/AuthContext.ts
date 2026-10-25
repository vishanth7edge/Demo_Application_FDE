import { createContext } from 'react'

import type { AuthSession, AuthUser, LoginInput } from '../application/index.ts'
import type { ApiResult } from '../../../shared/api/apiClient.ts'

export type AuthStatus = 'checking' | 'authenticated' | 'anonymous'

export interface AuthContextValue {
  status: AuthStatus
  user: AuthUser | null
  /** Why the user was signed out (e.g. session expired), shown once on the login page. */
  notice: string | null
  signIn: (input: LoginInput) => Promise<ApiResult<AuthSession>>
  signOut: () => Promise<void>
  clearNotice: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
