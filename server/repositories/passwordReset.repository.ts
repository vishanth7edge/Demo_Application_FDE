import type { Db } from '../db/database.ts'

/** Records a reset request. The demo has no mail service: this table is the "outbox". */
export function insertPasswordResetRequest(db: Db, email: string, userId: number | null): void {
  db.prepare(
    'INSERT INTO password_reset_requests (email, user_id, requested_at) VALUES (?, ?, ?)',
  ).run(email, userId, new Date().toISOString())
}
