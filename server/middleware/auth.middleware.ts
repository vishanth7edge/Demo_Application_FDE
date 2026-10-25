import type { Request, RequestHandler } from 'express'

import type { UserRole } from '../../src/domains/auth/domain/auth.types.ts'
import type { Db } from '../db/database.ts'
import { HttpError } from '../lib/httpError.ts'
import { readBearerToken } from '../lib/request.ts'
import { authenticate } from '../services/auth.service.ts'
import type { AuthenticatedSession } from '../services/auth.service.ts'

const sessions = new WeakMap<Request, AuthenticatedSession>()

/** Rejects the request with 401 unless it carries a valid, unexpired bearer token. */
export function requireAuth(db: Db): RequestHandler {
  return (req, _res, next) => {
    sessions.set(req, authenticate(db, readBearerToken(req.get('authorization'))))
    next()
  }
}

export function getSession(req: Request): AuthenticatedSession {
  const session = sessions.get(req)
  if (session === undefined) {
    throw new Error('getSession() called on a route without requireAuth()')
  }
  return session
}

export function requireRole(role: UserRole): RequestHandler {
  return (req, _res, next) => {
    if (getSession(req).user.role !== role) {
      throw new HttpError(403, 'FORBIDDEN', "You don't have permission to perform this action.")
    }
    next()
  }
}
