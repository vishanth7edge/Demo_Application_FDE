const TOKEN_KEY = 'auth_token'

// localStorage can throw (private mode, blocked site data), so every access is guarded.
export function saveToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token)
  } catch {
    // Storage unavailable: the user simply has to log in again next time.
  }
}

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function clearToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY)
  } catch {
    // Nothing to clear if storage is unavailable.
  }
}

const USERNAME_KEY = 'auth_username'

export function saveUsername(username: string): void {
  try {
    localStorage.setItem(USERNAME_KEY, username)
  } catch {
    // Storage unavailable: the name is lost on reload, the user logs in again anyway.
  }
}

export function getUsername(): string | null {
  try {
    return localStorage.getItem(USERNAME_KEY)
  } catch {
    return null
  }
}

export function clearUsername(): void {
  try {
    localStorage.removeItem(USERNAME_KEY)
  } catch {
    // Nothing to clear if storage is unavailable.
  }
}
