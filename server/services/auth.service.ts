import { randomBytes } from 'node:crypto'

import type { AuthSession, CurrentSession } from '../../src/domains/auth/domain/auth.types.ts'
import { validateEmail } from '../../src/shared/validation/email.ts'
import type { ServerConfig } from '../config.ts'
import type { Db } from '../db/database.ts'
import { HttpError, validationError } from '../lib/httpError.ts'
import type { FieldErrorDetail } from '../lib/httpError.ts'
import { verifyPassword } from '../lib/password.ts'
import { insertPasswordResetRequest } from '../repositories/passwordReset.repository.ts'
import { deleteSession, findSession, insertSession } from '../repositories/session.repository.ts'
import { findUserByEmail } from '../repositories/user.repository.ts'

export interface AuthenticatedSession extends CurrentSession {
  token: string
}

function normalizeEmail(email: string): string {
  return email.toLowerCase()
}

export function login(db: Db, config: ServerConfig, email: string, password: string): AuthSession {
  const details: FieldErrorDetail[] = []
  if (email.trim() === '') {
    details.push({ field: 'email', message: 'Email address is required' })
  }
  if (password === '') {
    details.push({ field: 'password', message: 'Password is required' })
  }
  if (details.length > 0) {
    throw validationError(details)
  }

  const user = findUserByEmail(db, normalizeEmail(email))
  if (user === undefined || !verifyPassword(password, user.passwordHash)) {
    throw new HttpError(401, 'INVALID_CREDENTIALS', 'Invalid email or password.')
  }

  const now = new Date()
  const expiresAt = new Date(now.getTime() + config.sessionTtlMinutes * 60_000).toISOString()
  const token = randomBytes(32).toString('base64url')
  insertSession(db, { token, userId: user.id, createdAt: now.toISOString(), expiresAt })

  return {
    token,
    expiresAt,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  }
}

/** Resolves a bearer token to its session, or throws 401. */
export function authenticate(db: Db, token: string): AuthenticatedSession {
  if (token === '') {
    throw new HttpError(401, 'UNAUTHENTICATED', 'Please sign in to continue.')
  }
  const session = findSession(db, token)
  if (session === undefined) {
    throw new HttpError(401, 'UNAUTHENTICATED', 'Please sign in to continue.')
  }
  if (Date.parse(session.expiresAt) <= Date.now()) {
    deleteSession(db, token)
    throw new HttpError(401, 'SESSION_EXPIRED', 'Your session has expired. Please sign in again.')
  }
  return session
}

export function logout(db: Db, token: string): void {
  deleteSession(db, token)
}

/** Records a (mock) reset email. Returns whether an account exists for the address. */
export function requestPasswordReset(db: Db, email: string): { accountFound: boolean } {
  const error = validateEmail(email)
  if (error !== null) {
    throw validationError([{ field: 'email', message: error }])
  }
  const normalized = normalizeEmail(email)
  const user = findUserByEmail(db, normalized)
  insertPasswordResetRequest(db, normalized, user?.id ?? null)
  if (user !== undefined) {
    process.stdout.write(`[mock-mail] Password reset link queued for ${normalized} (not sent)\n`)
  }
  return { accountFound: user !== undefined }
}
