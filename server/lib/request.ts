// Helpers for reading untrusted request input without `any`.

import { HttpError } from './httpError.ts'

export type JsonRecord = Record<string, unknown>

export function asRecord(value: unknown): JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as JsonRecord)
    : {}
}

export function readString(record: JsonRecord, key: string): string {
  const value = record[key]
  return typeof value === 'string' ? value : ''
}

/** `null` when missing or empty, `NaN` when present but not a number. */
export function readNumber(record: JsonRecord, key: string): number | null {
  const value = record[key]
  if (value === undefined || value === null || value === '') {
    return null
  }
  return typeof value === 'number' ? value : Number.NaN
}

/** Reads the `:id` route parameter as a positive integer, or throws 400. */
export function parseIdParam(params: unknown): number {
  const raw = asRecord(params)['id']
  const id = typeof raw === 'string' ? Number(raw) : Number.NaN
  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, 'INVALID_ID', 'The product id must be a positive whole number.')
  }
  return id
}

export function readBearerToken(header: string | undefined): string {
  if (header === undefined) {
    return ''
  }
  const [scheme, token] = header.split(' ')
  return scheme === 'Bearer' && token !== undefined ? token : ''
}
