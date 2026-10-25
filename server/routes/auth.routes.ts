import { Router } from 'express'

import type { ServerConfig } from '../config.ts'
import type { Db } from '../db/database.ts'
import { HttpError } from '../lib/httpError.ts'
import { asRecord, readString } from '../lib/request.ts'
import { getSession, requireAuth } from '../middleware/auth.middleware.ts'
import { login, logout, requestPasswordReset } from '../services/auth.service.ts'

export function createAuthRouter(db: Db, config: ServerConfig): Router {
  const router = Router()

  router.post('/login', (req, res) => {
    const body = asRecord(req.body)
    res.json(login(db, config, readString(body, 'email'), readString(body, 'password')))
  })

  router.get('/me', requireAuth(db), (req, res) => {
    const { user, expiresAt } = getSession(req)
    res.json({ user, expiresAt })
  })

  router.post('/logout', requireAuth(db), (req, res) => {
    logout(db, req.get('authorization') ?? '')
    res.status(204).end()
  })

  router.post('/forgot-password', (req, res) => {
    const { accountFound } = requestPasswordReset(db, readString(asRecord(req.body), 'email'))
    if (!accountFound) {
      throw new HttpError(
        404,
        'ACCOUNT_NOT_FOUND',
        "We couldn't find an account with that email address.",
      )
    }
    res.json({ message: "We've sent a password reset link to your email address." })
  })

  return router
}
