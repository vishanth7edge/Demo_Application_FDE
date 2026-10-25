import { Router } from 'express'

import type { Db } from '../db/database.ts'
import { getDashboardSummary } from '../services/dashboard.service.ts'

export function createDashboardRouter(db: Db): Router {
  const router = Router()

  router.get('/summary', (_req, res) => {
    res.json(getDashboardSummary(db))
  })

  return router
}
