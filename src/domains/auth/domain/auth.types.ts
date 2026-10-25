// Pure auth types, shared with the API server.

export const USER_ROLES = ['admin', 'viewer'] as const
export type UserRole = (typeof USER_ROLES)[number]

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrator',
  viewer: 'Viewer (read-only)',
}

export interface AuthUser {
  id: number
  name: string
  email: string
  role: UserRole
}

export interface AuthSession {
  token: string
  expiresAt: string
  user: AuthUser
}

export interface CurrentSession {
  expiresAt: string
  user: AuthUser
}

export interface LoginInput {
  email: string
  password: string
}

export type LoginFieldErrors = Partial<Record<keyof LoginInput, string>>
