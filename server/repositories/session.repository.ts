import type { AuthUser, UserRole } from '../../src/domains/auth/domain/auth.types.ts'
import type { Db } from '../db/database.ts'

export interface SessionRecord {
  token: string
  expiresAt: string
  user: AuthUser
}

interface SessionRow {
  token: string
  expiresAt: string
  userId: number
  name: string
  email: string
  role: UserRole
}

export function insertSession(
  db: Db,
  session: { token: string; userId: number; createdAt: string; expiresAt: string },
): void {
  db.prepare(
    `INSERT INTO sessions (token, user_id, created_at, expires_at)
     VALUES (@token, @userId, @createdAt, @expiresAt)`,
  ).run(session)
}

export function findSession(db: Db, token: string): SessionRecord | undefined {
  const row = db
    .prepare<[string], SessionRow>(
      `SELECT s.token, s.expires_at AS expiresAt, u.id AS userId, u.name, u.email, u.role
       FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.token = ?`,
    )
    .get(token)
  if (row === undefined) {
    return undefined
  }
  return {
    token: row.token,
    expiresAt: row.expiresAt,
    user: { id: row.userId, name: row.name, email: row.email, role: row.role },
  }
}

export function deleteSession(db: Db, token: string): number {
  return db.prepare('DELETE FROM sessions WHERE token = ?').run(token).changes
}

/** Test helper: makes every session look expired. */
export function expireAllSessions(db: Db): void {
  db.prepare('UPDATE sessions SET expires_at = ?').run(new Date(0).toISOString())
}
