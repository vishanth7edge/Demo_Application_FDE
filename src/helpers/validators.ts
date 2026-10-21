/** An error message, or `null` when the value is valid. */
export type ValidationError = string | null

export type FormErrors<T> = { [K in keyof T]: ValidationError }

export const MIN_NAME_LENGTH = 2
export const MIN_PASSWORD_LENGTH = 8

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateRequired(value: string, label: string): ValidationError {
  return value.trim() === '' ? `${label} is required` : null
}

export function validateName(name: string): ValidationError {
  const required = validateRequired(name, 'Name')
  if (required !== null) {
    return required
  }
  return name.trim().length < MIN_NAME_LENGTH
    ? `Name must be at least ${String(MIN_NAME_LENGTH)} characters`
    : null
}

export function validateEmail(email: string): ValidationError {
  const required = validateRequired(email, 'Email')
  if (required !== null) {
    return required
  }
  return EMAIL_PATTERN.test(email.trim()) ? null : 'Enter a valid email address'
}

export function validatePassword(password: string): ValidationError {
  const required = validateRequired(password, 'Password')
  if (required !== null) {
    return required
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${String(MIN_PASSWORD_LENGTH)} characters`
  }
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return 'Password must contain a letter and a number'
  }
  return null
}

export function validateConfirmPassword(
  password: string,
  confirmPassword: string,
): ValidationError {
  const required = validateRequired(confirmPassword, 'Confirm password')
  if (required !== null) {
    return required
  }
  return password === confirmPassword ? null : 'Passwords do not match'
}

export interface LoginValues {
  username: string
  password: string
}

export interface SignupValues {
  name: string
  email: string
  password: string
  confirmPassword: string
}

export function validateLoginForm(values: LoginValues): FormErrors<LoginValues> {
  return {
    username: validateRequired(values.username, 'Username'),
    // Login only checks presence; the strength rules apply when choosing a password.
    password: validateRequired(values.password, 'Password'),
  }
}

export function validateSignupForm(values: SignupValues): FormErrors<SignupValues> {
  return {
    name: validateName(values.name),
    email: validateEmail(values.email),
    password: validatePassword(values.password),
    confirmPassword: validateConfirmPassword(values.password, values.confirmPassword),
  }
}

export function hasErrors(errors: Readonly<Record<string, ValidationError>>): boolean {
  return Object.values(errors).some((error) => error !== null)
}
