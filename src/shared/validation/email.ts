// Shared email field rules, used by the auth forms and the API server.

export const EMAIL_MAX_LENGTH = 254

const EMAIL_PATTERN = /^[A-Za-z0-9._-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/

/** Returns an error message, or `null` when the value is a valid email address. */
export function validateEmail(raw: string): string | null {
  const value = raw.trim()
  if (value.length === 0) {
    return 'Email address is required'
  }
  if (value.length > EMAIL_MAX_LENGTH || !EMAIL_PATTERN.test(value)) {
    return 'Enter a valid email address, for example name@company.com'
  }
  return null
}
