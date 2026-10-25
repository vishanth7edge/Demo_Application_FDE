// The single HTTP client: auth header, error normalisation and session-expiry handling.

export interface FieldError {
  field: string
  message: string
}

export type ApiResult<T> =
  | { error: false; data: T }
  | { error: true; status: number; code: string; message: string; details: FieldError[] }

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

interface RequestOptions {
  method?: HttpMethod
  body?: unknown
  /** Login uses this: a 401 there means bad credentials, not an expired session. */
  skipSessionHandling?: boolean
}

const TOKEN_STORAGE_KEY = 'buggy-store.token'

const DEFAULT_MESSAGES: Record<number, string> = {
  0: "We couldn't reach the server. Check your connection and try again.",
  401: 'Please sign in to continue.',
  403: "You don't have permission to perform this action.",
  404: 'The requested item was not found.',
}
const SERVER_UNAVAILABLE = 'The server is not responding. Please try again in a moment.'

function readStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY)
  } catch {
    return null
  }
}

let authToken: string | null = readStoredToken()
let sessionEndedHandler: ((code: string) => void) | null = null

export function getAuthToken(): string | null {
  return authToken
}

export function setAuthToken(token: string | null): void {
  authToken = token
  try {
    if (token === null) {
      localStorage.removeItem(TOKEN_STORAGE_KEY)
    } else {
      localStorage.setItem(TOKEN_STORAGE_KEY, token)
    }
  } catch {
    // Storage can be unavailable (private mode); the in-memory token still works.
  }
}

/** Called when an authenticated request comes back 401 (expired or revoked session). */
export function onSessionEnded(handler: ((code: string) => void) | null): void {
  sessionEndedHandler = handler
}

function parseErrorBody(payload: unknown): {
  code?: string
  message?: string
  details: FieldError[]
} {
  if (typeof payload !== 'object' || payload === null || !('error' in payload)) {
    return { details: [] }
  }
  const error = payload.error
  if (typeof error !== 'object' || error === null) {
    return { details: [] }
  }
  const code = 'code' in error && typeof error.code === 'string' ? error.code : undefined
  const message =
    'message' in error && typeof error.message === 'string' ? error.message : undefined
  const details =
    'details' in error && Array.isArray(error.details) ? (error.details as FieldError[]) : []
  return {
    ...(code === undefined ? {} : { code }),
    ...(message === undefined ? {} : { message }),
    details,
  }
}

async function readJson(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return null
  }
  try {
    return (await response.json()) as unknown
  } catch {
    return null
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<ApiResult<T>> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }
  const sentToken = authToken
  if (sentToken !== null) {
    headers['Authorization'] = `Bearer ${sentToken}`
  }

  let response: Response
  try {
    response = await fetch(path, {
      method: options.method ?? 'GET',
      headers,
      ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
    })
  } catch {
    return {
      error: true,
      status: 0,
      code: 'NETWORK_ERROR',
      message: DEFAULT_MESSAGES[0] ?? '',
      details: [],
    }
  }

  const payload = await readJson(response)
  if (response.ok) {
    return { error: false, data: payload as T }
  }

  const body = parseErrorBody(payload)
  // A 5xx without our error envelope comes from the dev proxy: the API process is down.
  const fallback =
    response.status >= 500
      ? SERVER_UNAVAILABLE
      : (DEFAULT_MESSAGES[response.status] ?? 'Request failed.')
  const code = body.code ?? (response.status >= 500 ? 'SERVER_UNAVAILABLE' : 'HTTP_ERROR')

  if (response.status === 401 && options.skipSessionHandling !== true && sentToken !== null) {
    setAuthToken(null)
    sessionEndedHandler?.(code)
  }
  return {
    error: true,
    status: response.status,
    code,
    message: body.message ?? fallback,
    details: body.details,
  }
}

export function apiGet<T>(path: string): Promise<ApiResult<T>> {
  return apiRequest<T>(path)
}

export function apiPost<T>(
  path: string,
  body?: unknown,
  options: RequestOptions = {},
): Promise<ApiResult<T>> {
  return apiRequest<T>(path, { ...options, method: 'POST', body: body ?? {} })
}

export function apiPut<T>(path: string, body: unknown): Promise<ApiResult<T>> {
  return apiRequest<T>(path, { method: 'PUT', body })
}

export function apiDelete(path: string): Promise<ApiResult<null>> {
  return apiRequest<null>(path, { method: 'DELETE' })
}
