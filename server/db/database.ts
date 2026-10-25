import fs from 'node:fs'
import path from 'node:path'

import Database from 'better-sqlite3'

import { SCHEMA_VERSION } from './schema.ts'
import { resetDatabase } from './seed.ts'

export type Db = Database.Database

/**
 * Opens (and if needed creates) the SQLite database. A missing database, or one built from an
 * older schema version, is rebuilt with the demo dataset: the file is disposable demo data.
 */
export function openDatabase(file: string): Db {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  const db = new Database(file)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  db.pragma('busy_timeout = 5000')

  const version = db.pragma('user_version', { simple: true })
  if (version !== SCHEMA_VERSION) {
    if (version !== 0) {
      console.warn(`[db] Schema version ${String(version)} is outdated; rebuilding the demo data.`)
    }
    resetDatabase(db)
  }
  return db
}
