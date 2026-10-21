import { type ApiResult, apiPost, isRecord } from '../shared/apiClient.ts'
import { saveToken } from '../helpers/tokenStorage.ts'

const TOKEN_LIFETIME_MINUTES = 30

export interface LoginInput {
  username: string
  password: string
}

export interface AuthSession {
  id: number
  username: string
  accessToken: string
}

export interface SignupInput {
  name: string
  email: string
  password: string
}

export interface CreatedUser {
  id: number
  email: string
}

function parseSession(json: unknown): AuthSession | null {
  if (
    isRecord(json) &&
    typeof json['id'] === 'number' &&
    typeof json['username'] === 'string' &&
    typeof json['accessToken'] === 'string'
  ) {
    return { id: json['id'], username: json['username'], accessToken: json['accessToken'] }
  }
  return null
}

function parseCreatedUser(json: unknown): CreatedUser | null {
  if (isRecord(json) && typeof json['id'] === 'number' && typeof json['email'] === 'string') {
    return { id: json['id'], email: json['email'] }
  }
  return null
}

/** POST /auth/login. On success the access token is saved to localStorage. */
export async function login(input: LoginInput): Promise<ApiResult<AuthSession>> {
  const result = await apiPost(
    '/auth/login',
    { ...input, expiresInMins: TOKEN_LIFETIME_MINUTES },
    parseSession,
  )
  if (!result.error) {
    saveToken(result.data.accessToken)
  }
  return result
}

/**
 * POST /users/add. DummyJSON only simulates the insert (nothing is stored and no token is
 * returned), so the new account cannot log in afterwards.
 */
export function signup(input: SignupInput): Promise<ApiResult<CreatedUser>> {
  return apiPost(
    '/users/add',
    { firstName: input.name, email: input.email, password: input.password },
    parseCreatedUser,
  )
}
