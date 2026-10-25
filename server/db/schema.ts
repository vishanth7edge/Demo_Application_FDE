// Bump SCHEMA_VERSION whenever SCHEMA_SQL changes: older demo databases are rebuilt and reseeded.
export const SCHEMA_VERSION = 1

export const SCHEMA_SQL = `
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'viewer')),
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE TABLE products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL CHECK (length(name) <= 80),
  sku TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  quantity INTEGER NOT NULL CHECK (quantity >= 0),
  status TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'discontinued')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_products_created_at ON products (created_at);

CREATE TABLE password_reset_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  user_id INTEGER REFERENCES users (id) ON DELETE SET NULL,
  requested_at TEXT NOT NULL
);
`

export const DROP_SQL = `
DROP TABLE IF EXISTS password_reset_requests;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS users;
`
