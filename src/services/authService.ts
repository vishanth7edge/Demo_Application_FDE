import { apiGet, apiPost } from '../shared/httpClient.ts'

import type { ApiResult } from '../shared/httpClient.ts'

// DummyJSON (https://dummyjson.com/docs/auth, /docs/users) stands in for the real API.

export interface LoginInput {
  username: string
  password: string
}

export interface AuthUser {
  id: number
  username: string
  email: string
  firstName: string
  lastName: string
  image: string
}

export interface LoginResult {
  user: AuthUser
  accessToken: string
  refreshToken: string
}

export interface SignupInput {
  firstName: string
  lastName: string
  email: string
  password: string
}

export interface SignupResult {
  id: number
  firstName: string
  lastName: string
  email: string
}

const UNEXPECTED_RESPONSE = { error: true, message: 'Unexpected response from the server' } as const

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function hasStrings(value: Record<string, unknown>, keys: readonly string[]): boolean {
  return keys.every((key) => typeof value[key] === 'string')
}

function parseUser(data: Record<string, unknown>): AuthUser | undefined {
  if (
    typeof data['id'] !== 'number' ||
    !hasStrings(data, ['username', 'email', 'firstName', 'lastName', 'image'])
  ) {
    return undefined
  }
  return {
    id: data['id'],
    username: String(data['username']),
    email: String(data['email']),
    firstName: String(data['firstName']),
    lastName: String(data['lastName']),
    image: String(data['image']),
  }
}

// Does not store the token: that is the caller's job (see AuthContext).
export async function login(input: LoginInput): Promise<ApiResult<LoginResult>> {
  const result = await apiPost('/auth/login', {
    username: input.username.trim(),
    password: input.password,
  })
  if (result.error) {
    return result
  }

  const data = result.data
  if (!isRecord(data) || !hasStrings(data, ['accessToken', 'refreshToken'])) {
    return UNEXPECTED_RESPONSE
  }
  const user = parseUser(data)
  if (user === undefined) {
    return UNEXPECTED_RESPONSE
  }
  return {
    error: false,
    data: {
      user,
      accessToken: String(data['accessToken']),
      refreshToken: String(data['refreshToken']),
    },
  }
}

// The user for the saved token (sent by the HTTP client). 401 means it is missing or expired.
export async function getCurrentUser(): Promise<ApiResult<AuthUser>> {
  const result = await apiGet('/auth/me')
  if (result.error) {
    return result
  }
  const user = isRecord(result.data) ? parseUser(result.data) : undefined
  return user === undefined ? UNEXPECTED_RESPONSE : { error: false, data: user }
}

// DummyJSON returns the new user but does not persist it or issue a token.
export async function signup(input: SignupInput): Promise<ApiResult<SignupResult>> {
  const result = await apiPost('/users/add', {
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    email: input.email.trim(),
    password: input.password,
  })
  if (result.error) {
    return result
  }

  const data = result.data
  if (
    !isRecord(data) ||
    typeof data['id'] !== 'number' ||
    !hasStrings(data, ['firstName', 'lastName', 'email'])
  ) {
    return UNEXPECTED_RESPONSE
  }

  return {
    error: false,
    data: {
      id: data['id'],
      firstName: String(data['firstName']),
      lastName: String(data['lastName']),
      email: String(data['email']),
    },
  }
}
