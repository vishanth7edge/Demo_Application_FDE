// Restores the known demo dataset: `npm run db:reset` (16 products) or `npm run db:reset:large`.
// Safe to run while the API is running; every user is signed out.

import { loadConfig } from '../config.ts'
import { openDatabase } from '../db/database.ts'
import { resetDatabase } from '../db/seed.ts'
import { SEED_USERS } from '../db/seedData.ts'

const large = process.argv.includes('--large')
const config = loadConfig()
const db = openDatabase(config.dbFile)

resetDatabase(db, { large })
const count = db.prepare<[], { count: number }>('SELECT COUNT(*) AS count FROM products').get()

process.stdout.write(
  `Reset ${config.dbFile}: ${String(count?.count ?? 0)} products${large ? ' (large dataset)' : ''}.\n` +
    `Demo accounts: ${SEED_USERS.map((user) => `${user.email} / ${user.password}`).join(', ')}\n`,
)
db.close()
