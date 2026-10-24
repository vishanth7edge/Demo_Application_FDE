import { useMemo, useState } from 'react'

import {
  clearToken,
  clearUsername,
  getToken,
  getUsername,
  saveUsername,
} from '../../helpers/tokenStorage.ts'
import { AuthContext, type AuthContextValue, type AuthUser } from './AuthContext.ts'

export interface AuthProviderProps {
  children: React.ReactNode
}

function readStoredUser(): AuthUser | null {
  const username = getUsername()
  return getToken() !== null && username !== null ? { username } : null
}

export default function AuthProvider({ children }: AuthProviderProps): React.JSX.Element {
  const [user, setUser] = useState<AuthUser | null>(readStoredUser)

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      signIn: (username) => {
        saveUsername(username)
        setUser({ username })
      },
      logout: () => {
        clearToken()
        clearUsername()
        setUser(null)
      },
    }),
    [user],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}
