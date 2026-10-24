import { createContext } from 'react'

export interface AuthUser {
  username: string
}

export interface AuthContextValue {
  user: AuthUser | null
  signIn: (username: string) => void
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
