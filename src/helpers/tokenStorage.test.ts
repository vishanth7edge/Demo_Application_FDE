import { afterEach, describe, expect, it, vi } from 'vitest'

import { clearToken, getToken, saveToken } from './tokenStorage.ts'

afterEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
})

describe('tokenStorage', () => {
  it('returns null when nothing is saved', () => {
    expect(getToken()).toBeNull()
  })

  it('saves, reads and clears the token', () => {
    saveToken('abc')
    expect(getToken()).toBe('abc')

    clearToken()
    expect(getToken()).toBeNull()
  })

  it('does not throw when localStorage is unavailable', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('blocked')
    })

    expect(() => {
      saveToken('abc')
    }).not.toThrow()
    expect(getToken()).toBeNull()
    expect(() => {
      clearToken()
    }).not.toThrow()
  })
})
