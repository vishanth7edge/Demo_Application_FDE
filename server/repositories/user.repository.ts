import type { UserRole } from '../../src/domains/auth/domain/auth.types.ts'
import type { Db } from '../db/database.ts'

export interface UserRecord {
  id: number
  email: string
  name: string
  role: UserRole
  passwordHash: string
}

export function findUserByEmail(db: Db, email: string): UserRecord | undefined {
  return db
    .prepare<[string], UserRecord>(
      'SELECT id, email, name, role, password_hash AS passwordHash FROM users WHERE email = ?',
    )
    .get(email)
}
