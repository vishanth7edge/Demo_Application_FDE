import { Router } from 'express'

import type { Db } from '../db/database.ts'
import { parseIdParam } from '../lib/request.ts'
import { requireRole } from '../middleware/auth.middleware.ts'
import {
  createProduct,
  deleteProduct,
  getProduct,
  listProducts,
  parseListQuery,
  updateProduct,
} from '../services/product.service.ts'

/** Mounted behind requireAuth(); writes additionally require the admin role. */
export function createProductRouter(db: Db): Router {
  const router = Router()

  router.get('/', (req, res) => {
    res.json(listProducts(db, parseListQuery(req.query)))
  })

  router.get('/:id', (req, res) => {
    res.json(getProduct(db, parseIdParam(req.params)))
  })

  router.post('/', requireRole('admin'), (req, res) => {
    res.status(201).json(createProduct(db, req.body))
  })

  router.put('/:id', requireRole('admin'), (req, res) => {
    res.json(updateProduct(db, parseIdParam(req.params), req.body))
  })

  router.delete('/:id', requireRole('admin'), (req, res) => {
    deleteProduct(db, parseIdParam(req.params))
    res.status(204).end()
  })

  return router
}
