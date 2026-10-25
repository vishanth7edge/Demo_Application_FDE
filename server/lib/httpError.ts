export interface FieldErrorDetail {
  field: string
  message: string
}

/** An error that maps directly to an HTTP response: `{ error: { code, message, details } }`. */
export class HttpError extends Error {
  readonly status: number
  readonly code: string
  readonly details: FieldErrorDetail[]

  constructor(status: number, code: string, message: string, details: FieldErrorDetail[] = []) {
    super(message)
    this.name = 'HttpError'
    this.status = status
    this.code = code
    this.details = details
  }
}

export function validationError(details: FieldErrorDetail[]): HttpError {
  return new HttpError(400, 'VALIDATION_ERROR', 'Some fields need your attention.', details)
}

export function notFoundError(message: string): HttpError {
  return new HttpError(404, 'NOT_FOUND', message)
}
