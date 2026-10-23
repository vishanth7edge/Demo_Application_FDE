import { createContext } from 'react'

import type { AuthUser, LoginInput } from '../services/authService.ts'
import type { ApiResult } from '../shared/httpClient.ts'

// 'restoring' = a token was found on load and the user is being fetched with it.
export type AuthStatus = 'restoring' | 'authenticated' | 'anonymous'

export interface AuthContextValue {
  status: AuthStatus
  user: AuthUser | null
  login: (input: LoginInput) => Promise<ApiResult<AuthUser>>
  logout: () => void
}

// Provided by <AuthProvider>; read it with useAuth().
export const AuthContext = createContext<AuthContextValue | null>(null)
