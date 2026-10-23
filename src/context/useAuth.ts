import { use } from 'react'

import { AuthContext } from './AuthContext.ts'

import type { AuthContextValue } from './AuthContext.ts'

export function useAuth(): AuthContextValue {
  const context = use(AuthContext)
  if (context === null) {
    throw new Error('useAuth must be used inside <AuthProvider>')
  }
  return context
}
