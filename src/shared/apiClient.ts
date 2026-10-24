export interface ApiSuccess<T> {
  error: false
  data: T
}

export interface ApiFailure {
  error: true
  status?: number | undefined
  message: string
}

export type ApiResult<T> = ApiSuccess<T> | ApiFailure

const NETWORK_ERROR_MESSAGE = 'Could not reach the server. Check your connection and try again.'
const FALLBACK_ERROR_MESSAGE = 'Something went wrong. Please try again.'

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function readMessage(json: unknown): string | null {
  if (isRecord(json) && typeof json['message'] === 'string') {
    return json['message']
  }
  return null
}

type HttpMethod = 'GET' | 'POST' | 'DELETE'

/**
 * Sends a JSON request to `VITE_API_BASE_URL` + `path`. `parse` turns the untrusted response body
 * into `T` (return `null` when it has the wrong shape), so callers never touch an unchecked `any`.
 */
async function apiRequest<T>(
  method: HttpMethod,
  path: string,
  body: unknown,
  parse: (json: unknown) => T | null,
): Promise<ApiResult<T>> {
  const baseUrl = import.meta.env.VITE_API_BASE_URL
  if (baseUrl === undefined || baseUrl === '') {
    return { error: true, message: 'VITE_API_BASE_URL is not set' }
  }

  let response: Response
  try {
    response = await fetch(`${baseUrl.replace(/\/+$/, '')}${path}`, {
      method,
      ...(body === undefined
        ? {}
        : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
    })
  } catch {
    return { error: true, message: NETWORK_ERROR_MESSAGE }
  }

  let json: unknown = null
  try {
    json = await response.json()
  } catch {
    // Non-JSON body: handled below by the status check or the parser.
  }

  if (!response.ok) {
    return {
      error: true,
      status: response.status,
      message: readMessage(json) ?? FALLBACK_ERROR_MESSAGE,
    }
  }

  const data = parse(json)
  if (data === null) {
    return { error: true, status: response.status, message: FALLBACK_ERROR_MESSAGE }
  }
  return { error: false, data }
}

export function apiGet<T>(path: string, parse: (json: unknown) => T | null): Promise<ApiResult<T>> {
  return apiRequest('GET', path, undefined, parse)
}

export function apiPost<T>(
  path: string,
  body: unknown,
  parse: (json: unknown) => T | null,
): Promise<ApiResult<T>> {
  return apiRequest('POST', path, body, parse)
}

export function apiDelete<T>(
  path: string,
  parse: (json: unknown) => T | null,
): Promise<ApiResult<T>> {
  return apiRequest('DELETE', path, undefined, parse)
}
