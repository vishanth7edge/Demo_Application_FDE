// localStorage can throw (blocked storage, private mode, quota), so every access is guarded.

export const TOKEN_STORAGE_KEY = 'authToken'

export function saveToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_STORAGE_KEY, token)
  } catch (error) {
    console.warn('Could not save the auth token', error)
  }
}

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY)
  } catch {
    return null
  }
}

export function clearToken(): void {
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
  } catch (error) {
    console.warn('Could not clear the auth token', error)
  }
}
