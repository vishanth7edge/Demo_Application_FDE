import { describe, expect, it } from 'vitest'

import {
  hasErrors,
  validateConfirmPassword,
  validateEmail,
  validateLoginForm,
  validateNewPassword,
  validatePersonName,
  validateRequired,
  validateSignupForm,
  validateUsername,
} from './validators.ts'

describe('validateRequired', () => {
  it('rejects empty and whitespace-only values', () => {
    expect(validateRequired('', 'Field')).toBe('Field is required')
    expect(validateRequired('   ', 'Field')).toBe('Field is required')
  })

  it('accepts a non-empty value', () => {
    expect(validateRequired('x', 'Field')).toBeUndefined()
  })
})

describe('validateUsername', () => {
  it('requires a value', () => {
    expect(validateUsername('')).toBe('Username is required')
  })

  it('requires at least 3 characters, ignoring surrounding spaces', () => {
    expect(validateUsername(' ab ')).toBe('Username must be at least 3 characters')
    expect(validateUsername('abc')).toBeUndefined()
  })
})

describe('validatePersonName', () => {
  it('requires a value of at least 2 characters, using the label in messages', () => {
    expect(validatePersonName('', 'First name')).toBe('First name is required')
    expect(validatePersonName('A', 'Last name')).toBe('Last name must be at least 2 characters')
    expect(validatePersonName('Al', 'First name')).toBeUndefined()
  })
})

describe('validateEmail', () => {
  it('requires a value', () => {
    expect(validateEmail('')).toBe('Email is required')
  })

  it.each(['plain', 'no-domain@', '@no-user.com', 'no-tld@example', 'with space@example.com'])(
    'rejects %s',
    (email) => {
      expect(validateEmail(email)).toBe('Enter a valid email address')
    },
  )

  it('accepts a valid address, ignoring surrounding spaces', () => {
    expect(validateEmail(' user@example.com ')).toBeUndefined()
  })
})

describe('validateNewPassword', () => {
  it('requires a value', () => {
    expect(validateNewPassword('')).toBe('Password is required')
  })

  it('requires at least 8 characters', () => {
    expect(validateNewPassword('abc123')).toBe('Password must be at least 8 characters')
  })

  it('requires a letter and a number', () => {
    expect(validateNewPassword('abcdefgh')).toBe('Password must contain a letter and a number')
    expect(validateNewPassword('12345678')).toBe('Password must contain a letter and a number')
  })

  it('accepts a strong enough password', () => {
    expect(validateNewPassword('abcd1234')).toBeUndefined()
  })
})

describe('validateConfirmPassword', () => {
  it('requires a value', () => {
    expect(validateConfirmPassword('abcd1234', '')).toBe('Confirm your password')
  })

  it('requires an exact match', () => {
    expect(validateConfirmPassword('abcd1234', 'abcd1235')).toBe('Passwords do not match')
    expect(validateConfirmPassword('abcd1234', 'abcd1234')).toBeUndefined()
  })
})

describe('validateLoginForm', () => {
  it('returns an error per invalid field', () => {
    expect(validateLoginForm({ username: '', password: '' })).toEqual({
      username: 'Username is required',
      password: 'Password is required',
    })
  })

  it('does not apply new-password strength rules', () => {
    const errors = validateLoginForm({ username: 'alice', password: 'x' })
    expect(errors).toEqual({})
    expect(hasErrors(errors)).toBe(false)
  })
})

describe('validateSignupForm', () => {
  it('returns only the fields that failed', () => {
    const errors = validateSignupForm({
      firstName: 'Alice',
      lastName: 'Smith',
      email: 'not-an-email',
      password: 'abcd1234',
      confirmPassword: 'abcd9999',
    })
    expect(errors).toEqual({
      email: 'Enter a valid email address',
      confirmPassword: 'Passwords do not match',
    })
    expect(hasErrors(errors)).toBe(true)
  })

  it('returns no errors for valid values', () => {
    expect(
      validateSignupForm({
        firstName: 'Alice',
        lastName: 'Smith',
        email: 'alice@example.com',
        password: 'abcd1234',
        confirmPassword: 'abcd1234',
      }),
    ).toEqual({})
  })
})
