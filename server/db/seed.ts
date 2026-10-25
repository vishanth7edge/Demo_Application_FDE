import { hashPassword } from '../lib/password.ts'
import type { Db } from './database.ts'
import { DROP_SQL, SCHEMA_SQL, SCHEMA_VERSION } from './schema.ts'
import { buildLargeDataset, SEED_PRODUCTS, SEED_USERS } from './seedData.ts'
import type { SeedProduct } from './seedData.ts'

export interface SeedOptions {
  /** Adds 300 generated products on top of the 16 demo products. */
  large?: boolean
}

function insertProducts(db: Db, products: SeedProduct[]): void {
  const insert = db.prepare(
    `INSERT INTO products (name, sku, category, price_cents, quantity, status, created_at, updated_at)
     VALUES (@name, @sku, @category, @priceCents, @quantity, @status, @createdAt, @createdAt)`,
  )
  for (const product of products) {
    insert.run(product)
  }
}

export function seedDatabase(db: Db, options: SeedOptions = {}): void {
  const now = new Date().toISOString()
  db.transaction(() => {
    const insertUser = db.prepare(
      `INSERT INTO users (email, name, role, password_hash, created_at)
       VALUES (?, ?, ?, ?, ?)`,
    )
    for (const user of SEED_USERS) {
      insertUser.run(user.email, user.name, user.role, hashPassword(user.password), now)
    }
    if (options.large === true) {
      insertProducts(db, buildLargeDataset())
    }
    insertProducts(db, SEED_PRODUCTS)
  })()
}

/** Drops every table, recreates the schema and loads the known demo dataset. */
export function resetDatabase(db: Db, options: SeedOptions = {}): void {
  db.transaction(() => {
    db.exec(DROP_SQL)
    db.exec(SCHEMA_SQL)
    db.pragma(`user_version = ${String(SCHEMA_VERSION)}`)
  })()
  seedDatabase(db, options)
}
