import { describe, expect, it } from 'vitest'

import {
  hasErrors,
  validateConfirmPassword,
  validateEmail,
  validateLoginForm,
  validateName,
  validatePassword,
  validateRequired,
  validateSignupForm,
} from './validators.ts'

describe('validateRequired', () => {
  it('rejects empty and whitespace-only values', () => {
    expect(validateRequired('', 'Username')).toBe('Username is required')
    expect(validateRequired('   ', 'Username')).toBe('Username is required')
  })

  it('accepts a value', () => {
    expect(validateRequired('ada', 'Username')).toBeNull()
  })
})

describe('validateName', () => {
  it('requires a name of at least 2 characters', () => {
    expect(validateName('')).toBe('Name is required')
    expect(validateName(' a ')).toBe('Name must be at least 2 characters')
    expect(validateName('Al')).toBeNull()
  })
})

describe('validateEmail', () => {
  it('requires a value', () => {
    expect(validateEmail('')).toBe('Email is required')
  })

  it.each(['plain', 'a@b', '@b.com', 'a b@c.com', 'a@b .com'])('rejects %s', (email) => {
    expect(validateEmail(email)).toBe('Enter a valid email address')
  })

  it.each(['a@b.co', ' ada@example.com '])('accepts %s', (email) => {
    expect(validateEmail(email)).toBeNull()
  })
})

describe('validatePassword', () => {
  it('requires a value', () => {
    expect(validatePassword('')).toBe('Password is required')
  })

  it('requires at least 8 characters', () => {
    expect(validatePassword('abc123')).toBe('Password must be at least 8 characters')
  })

  it('requires a letter and a number', () => {
    expect(validatePassword('abcdefgh')).toBe('Password must contain a letter and a number')
    expect(validatePassword('12345678')).toBe('Password must contain a letter and a number')
  })

  it('accepts a strong password', () => {
    expect(validatePassword('abcdefg1')).toBeNull()
  })
})

describe('validateConfirmPassword', () => {
  it('requires a value', () => {
    expect(validateConfirmPassword('abcdefg1', '')).toBe('Confirm password is required')
  })

  it('requires a match', () => {
    expect(validateConfirmPassword('abcdefg1', 'abcdefg2')).toBe('Passwords do not match')
    expect(validateConfirmPassword('abcdefg1', 'abcdefg1')).toBeNull()
  })
})

describe('validateLoginForm', () => {
  it('reports every empty field', () => {
    expect(validateLoginForm({ username: '', password: '' })).toEqual({
      username: 'Username is required',
      password: 'Password is required',
    })
  })

  it('does not apply password strength rules on login', () => {
    expect(validateLoginForm({ username: 'ada', password: 'x' })).toEqual({
      username: null,
      password: null,
    })
  })
})

describe('validateSignupForm', () => {
  it('reports every invalid field', () => {
    const errors = validateSignupForm({
      name: '',
      email: 'nope',
      password: 'short',
      confirmPassword: '',
    })
    expect(errors.name).toBe('Name is required')
    expect(errors.email).toBe('Enter a valid email address')
    expect(errors.password).toBe('Password must be at least 8 characters')
    expect(errors.confirmPassword).toBe('Confirm password is required')
  })

  it('passes a valid form', () => {
    const errors = validateSignupForm({
      name: 'Ada',
      email: 'ada@example.com',
      password: 'abcdefg1',
      confirmPassword: 'abcdefg1',
    })
    expect(hasErrors(errors)).toBe(false)
  })
})

describe('hasErrors', () => {
  it('detects any non-null error', () => {
    expect(hasErrors({ a: null, b: null })).toBe(false)
    expect(hasErrors({ a: null, b: 'bad' })).toBe(true)
  })
})
