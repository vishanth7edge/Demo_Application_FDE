import path from 'node:path'

export interface ServerConfig {
  host: string
  port: number
  dbFile: string
  /** Artificial delay added to every API response so loading states are visible. */
  latencyMs: number
  sessionTtlMinutes: number
  /** Enables /api/test/* helpers used by the Playwright suite. Never on for the demo. */
  enableTestRoutes: boolean
}

function readNonNegativeInt(name: string, fallback: number): number {
  const raw = process.env[name]
  if (raw === undefined || raw.trim() === '') {
    return fallback
  }
  const value = Number(raw)
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${name} must be a non-negative integer, got "${raw}"`)
  }
  return value
}

export function loadConfig(): ServerConfig {
  return {
    // Loopback only: the demo contains deliberate defects and must not be reachable from the network.
    host: '127.0.0.1',
    port: readNonNegativeInt('API_PORT', 4000),
    dbFile: path.resolve(process.env['DB_FILE'] ?? 'data/buggy-store.db'),
    latencyMs: readNonNegativeInt('API_LATENCY_MS', 300),
    sessionTtlMinutes: readNonNegativeInt('SESSION_TTL_MINUTES', 60),
    enableTestRoutes: process.env['ENABLE_TEST_ROUTES'] === '1',
  }
}
