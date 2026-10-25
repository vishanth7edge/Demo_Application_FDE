import express from 'express'
import type { Express } from 'express'

import type { ServerConfig } from './config.ts'
import type { Db } from './db/database.ts'
import { requireAuth } from './middleware/auth.middleware.ts'
import { apiNotFound, errorHandler, latency, requestLogger } from './middleware/http.middleware.ts'
import { createAuthRouter } from './routes/auth.routes.ts'
import { createDashboardRouter } from './routes/dashboard.routes.ts'
import { createProductRouter } from './routes/product.routes.ts'
import { createTestRouter } from './routes/test.routes.ts'

export function createApp(db: Db, config: ServerConfig): Express {
  const app = express()
  app.disable('x-powered-by')
  app.use(express.json({ limit: '100kb' }))
  app.use(requestLogger)

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' })
  })
  if (config.enableTestRoutes) {
    app.use('/api/test', createTestRouter(db))
  }

  app.use('/api', latency(config.latencyMs))
  app.use('/api/auth', createAuthRouter(db, config))
  app.use('/api/products', requireAuth(db), createProductRouter(db))
  app.use('/api/dashboard', requireAuth(db), createDashboardRouter(db))
  app.use('/api', apiNotFound)
  app.use(errorHandler)

  return app
}
