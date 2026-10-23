import { describe, expect, it, vi } from 'vitest'

import { clearToken, getToken, saveToken, TOKEN_STORAGE_KEY } from './tokenStorage.ts'

describe('tokenStorage', () => {
  it('returns null when no token is saved', () => {
    expect(getToken()).toBeNull()
  })

  it('saves, reads and clears the token', () => {
    saveToken('abc')
    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBe('abc')
    expect(getToken()).toBe('abc')

    clearToken()
    expect(getToken()).toBeNull()
  })

  it('does not throw when storage is unavailable', () => {
    const blocked = (): never => {
      throw new DOMException('blocked', 'SecurityError')
    }
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(blocked)
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(blocked)
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(blocked)
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)

    expect(() => {
      saveToken('abc')
    }).not.toThrow()
    expect(getToken()).toBeNull()
    expect(() => {
      clearToken()
    }).not.toThrow()
  })
})
