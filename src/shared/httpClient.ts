import { getToken } from '../helpers/tokenStorage.ts'

// The single place that talks HTTP: base URL, auth header and error shape live here.

export type ApiResult<T> =
  { error: false; data: T } | { error: true; status?: number; message: string }

export const NETWORK_ERROR_MESSAGE =
  'Could not reach the server. Check your connection and try again.'

function getBaseUrl(): string | undefined {
  const value = import.meta.env.VITE_API_BASE_URL
  return value === undefined || value === '' ? undefined : value.replace(/\/+$/, '')
}

async function readJson(response: Response): Promise<unknown> {
  try {
    const body: unknown = await response.json()
    return body
  } catch {
    return undefined
  }
}

function readMessage(body: unknown): string | undefined {
  if (typeof body === 'object' && body !== null && 'message' in body) {
    return typeof body.message === 'string' ? body.message : undefined
  }
  return undefined
}

async function apiRequest(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  path: string,
  body?: unknown,
): Promise<ApiResult<unknown>> {
  const baseUrl = getBaseUrl()
  if (baseUrl === undefined) {
    return { error: true, message: 'VITE_API_BASE_URL is not set' }
  }

  const headers = new Headers()
  // FormData: leave Content-Type unset so the browser adds the multipart boundary.
  const isFormData = body instanceof FormData
  if (body !== undefined && !isFormData) {
    headers.set('Content-Type', 'application/json')
  }
  const token = getToken()
  if (token !== null) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  let response: Response
  try {
    response = await fetch(`${baseUrl}${path}`, {
      method,
      headers,
      body: body === undefined ? null : isFormData ? body : JSON.stringify(body),
    })
  } catch {
    return { error: true, message: NETWORK_ERROR_MESSAGE }
  }

  const data = await readJson(response)
  if (!response.ok) {
    return {
      error: true,
      status: response.status,
      message: readMessage(data) ?? `Request failed (${String(response.status)})`,
    }
  }
  return { error: false, data }
}

// All resolve with unchecked JSON; callers narrow `data` to their own type. A FormData body is sent
// as multipart, anything else as JSON.
export function apiGet(path: string): Promise<ApiResult<unknown>> {
  return apiRequest('GET', path)
}

export function apiPost(path: string, body: unknown): Promise<ApiResult<unknown>> {
  return apiRequest('POST', path, body)
}

export function apiPut(path: string, body: unknown): Promise<ApiResult<unknown>> {
  return apiRequest('PUT', path, body)
}

export function apiDelete(path: string): Promise<ApiResult<unknown>> {
  return apiRequest('DELETE', path)
}
