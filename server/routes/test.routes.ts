import { Router } from 'express'

import type { Db } from '../db/database.ts'
import { resetDatabase } from '../db/seed.ts'
import { asRecord } from '../lib/request.ts'
import { expireAllSessions } from '../repositories/session.repository.ts'

/** Helpers for the Playwright suite. Only mounted when ENABLE_TEST_ROUTES=1. */
export function createTestRouter(db: Db): Router {
  const router = Router()

  router.post('/reset', (req, res) => {
    resetDatabase(db, { large: asRecord(req.body)['large'] === true })
    res.status(204).end()
  })

  router.post('/expire-sessions', (_req, res) => {
    expireAllSessions(db)
    res.status(204).end()
  })

  return router
}
