import { createApp } from './app.ts'
import { loadConfig } from './config.ts'
import { openDatabase } from './db/database.ts'

const config = loadConfig()
const db = openDatabase(config.dbFile)
const app = createApp(db, config)

const server = app.listen(config.port, config.host, () => {
  process.stdout.write(
    `Buggy Store API listening on http://${config.host}:${String(config.port)}\n` +
      `  database: ${config.dbFile}\n` +
      `  latency: ${String(config.latencyMs)}ms, session TTL: ${String(config.sessionTtlMinutes)} min` +
      (config.enableTestRoutes ? ', test routes ENABLED' : '') +
      '\n',
  )
})

server.on('error', (error: NodeJS.ErrnoException) => {
  if (error.code === 'EADDRINUSE') {
    console.error(
      `Port ${String(config.port)} is already in use. Stop the other process or set API_PORT.`,
    )
  } else {
    console.error(error)
  }
  process.exit(1)
})

function shutdown(): void {
  server.close(() => {
    db.close()
    process.exit(0)
  })
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
