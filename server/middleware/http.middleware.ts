import type { ErrorRequestHandler, RequestHandler } from 'express'

import { HttpError } from '../lib/httpError.ts'

/** Logs one line per API request so the facilitator can follow traffic in the terminal. */
export const requestLogger: RequestHandler = (req, res, next) => {
  const started = performance.now()
  res.on('finish', () => {
    const duration = Math.round(performance.now() - started)
    process.stdout.write(
      `[api] ${req.method} ${req.originalUrl} ${String(res.statusCode)} ${String(duration)}ms\n`,
    )
  })
  next()
}

/** Simulates a realistic network round trip so loading states can be observed and tested. */
export function latency(ms: number): RequestHandler {
  return (_req, _res, next) => {
    if (ms === 0) {
      next()
      return
    }
    setTimeout(next, ms)
  }
}

export const apiNotFound: RequestHandler = (req) => {
  throw new HttpError(404, 'NOT_FOUND', `No API route matches ${req.method} ${req.path}.`)
}

function isBodyParseError(error: unknown): boolean {
  return error instanceof SyntaxError && 'type' in error && error.type === 'entity.parse.failed'
}

export const errorHandler: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
  if (error instanceof HttpError) {
    res.status(error.status).json({
      error: { code: error.code, message: error.message, details: error.details },
    })
    return
  }
  if (isBodyParseError(error)) {
    res.status(400).json({
      error: { code: 'INVALID_JSON', message: 'The request body is not valid JSON.', details: [] },
    })
    return
  }
  console.error('[api] Unhandled error:', error)
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Something went wrong on our side. Please try again later.',
      details: [],
    },
  })
}
