import {
  apiGet,
  apiPost,
  getAuthToken,
  onSessionEnded,
  setAuthToken,
} from '../../../shared/api/apiClient.ts'
import type { ApiResult } from '../../../shared/api/apiClient.ts'
import { validateEmail } from '../../../shared/validation/email.ts'
import { ROLE_LABELS } from '../domain/auth.types.ts'
import type {
  AuthSession,
  AuthUser,
  CurrentSession,
  LoginFieldErrors,
  LoginInput,
} from '../domain/auth.types.ts'

export const SESSION_EXPIRED_NOTICE = 'Your session has expired. Please sign in again.'
const SESSION_ENDED_NOTICE = 'Your session has ended. Please sign in again.'
const DEFAULT_LANDING_PATH = '/dashboard'

export function validateLoginInput(input: LoginInput): LoginFieldErrors {
  const errors: LoginFieldErrors = {}
  if (input.email.trim() === '') {
    errors.email = 'Email address is required'
  }
  if (input.password === '') {
    errors.password = 'Password is required'
  }
  return errors
}

export function validateForgotPasswordEmail(email: string): string | null {
  return validateEmail(email)
}

export function hasStoredSession(): boolean {
  return getAuthToken() !== null
}

export async function signInRequest(input: LoginInput): Promise<ApiResult<AuthSession>> {
  const result = await apiPost<AuthSession>('/api/auth/login', input, { skipSessionHandling: true })
  if (!result.error) {
    setAuthToken(result.data.token)
  }
  return result
}

export function fetchCurrentSession(): Promise<ApiResult<CurrentSession>> {
  return apiGet<CurrentSession>('/api/auth/me')
}

export async function signOutRequest(): Promise<void> {
  // Sign out locally even if the server call fails (e.g. the API is unreachable).
  await apiPost<null>('/api/auth/logout')
  setAuthToken(null)
}

export function requestPasswordReset(email: string): Promise<ApiResult<{ message: string }>> {
  return apiPost<{ message: string }>('/api/auth/forgot-password', { email })
}

/** Registers the handler for expired/revoked sessions. Receives the message to show. */
export function subscribeToSessionEnd(handler: ((notice: string) => void) | null): void {
  onSessionEnded(
    handler === null
      ? null
      : (code) => {
          handler(code === 'SESSION_EXPIRED' ? SESSION_EXPIRED_NOTICE : SESSION_ENDED_NOTICE)
        },
  )
}

/** Where to go after signing in: the page that sent the user to /login, or the dashboard. */
export function getPostLoginPath(locationState: unknown): string {
  if (typeof locationState === 'object' && locationState !== null && 'from' in locationState) {
    const from = locationState.from
    if (typeof from === 'string' && from.startsWith('/') && !from.startsWith('/login')) {
      return from
    }
  }
  return DEFAULT_LANDING_PATH
}

export function canManageProducts(user: AuthUser | null): boolean {
  return user?.role === 'admin'
}

export function getRoleLabel(user: AuthUser): string {
  return ROLE_LABELS[user.role]
}
