# Buggy Store

A small product-management admin app built for live **manual, exploratory and session-based
testing (SBT)** workshops. It looks and behaves like an ordinary internal tool: sign in, dashboard,
product catalogue with search/filter/sort/pagination, add/edit/delete. It also contains a set of
**deliberately seeded defects** for participants to find.

> **Facilitators:** the seeded defects are documented in `docs/defect-answer-key.md` (quick lookup:
> `reference_doc/bug-reference.md`) and verified by `e2e/defects/`. Do not give those (or the source code) to participants. See
> `docs/facilitator-guide.md`.

## Quick start

Requires **Node.js 20.19+** (Node 22/24 also work) and npm. Everything runs locally: no cloud
services, no external database.

```bash
npm install        # dependencies, git hooks, native SQLite driver
npm start          # builds the UI and starts the API + web server together
```

Open **http://localhost:5173**. The database (`data/buggy-store.db`) is created and seeded with 16
products on first start.

### Demo accounts

| Role               | Email                    | Password     |
| ------------------ | ------------------------ | ------------ |
| Administrator      | `admin@buggystore.test`  | `Admin@123`  |
| Viewer (read-only) | `viewer@buggystore.test` | `Viewer@123` |

These are local demo credentials stored as scrypt hashes in the disposable SQLite database; they
are not real secrets.

## Commands

| Command                     | What it does                                                                              |
| --------------------------- | ----------------------------------------------------------------------------------------- |
| `npm start`                 | Production build, then API (port 4000) + `vite preview` (port 5173). Use for demos.       |
| `npm run dev`               | Development: API with auto-restart + Vite dev server with hot reload (port 5173)          |
| `npm run start:api`         | API only (`tsx server/index.ts`)                                                          |
| `npm run start:web`         | Serve the last build only (`vite preview`, proxies `/api` to the API)                     |
| `npm run db:reset`          | Restore the known dataset (16 products, 2 users). Safe while running; signs everyone out. |
| `npm run db:reset:large`    | Same, plus 300 generated products (316 total) for performance and pagination testing      |
| `npm run test:e2e`          | Full Playwright suite (starts its own API, build and DB on ports 4100/4174)               |
| `npm run test:e2e:baseline` | Only the baseline flows that must always pass                                             |
| `npm run test:e2e:defects`  | Only the seeded-defect checks (reported as expected failures)                             |
| `npm run test:e2e:report`   | Open the last HTML report (screenshots and traces)                                        |
| `npm run check`             | Type check + ESLint + Prettier check                                                      |
| `npm run build`             | Type check, then production build into `dist/`                                            |
| `npm run arch`              | ArchGuard architecture check                                                              |

First Playwright run on a new machine: `npx playwright install chromium`.

### Reading the e2e results

`npm run test:e2e` should end with **75 passed**:

- `baseline` (42 tests): core journeys that work, such as sign in/out, session expiry, roles,
  dashboard, list, search, filters, paging, add/edit/delete and the API contract.
- `defects` (33 tests): each asserts the _correct_ behaviour and is marked `test.fail()`, so the
  seeded defect makes it fail, and Playwright counts that expected failure as a pass. If a defect is
  ever fixed, its test reports "expected to fail, but passed".
- `BUGGY_STORE_BASELINE=1 npm run test:e2e` runs the defect tests as normal tests, for a build with
  the defects removed.

## Architecture

```
src/                         React 19 + TypeScript SPA (Vite, Tailwind CSS v4, React Router 7)
  App.tsx                    Routes and route guards
  app/                       Authenticated layout, 404 page
  domains/<auth|products|dashboard>/
    domain/                  Types and pure rules (shared with the API server)
    application/             *.service.ts: API calls, query/form mapping, business rules
    presentation/            Pages, components, hooks
  shared/                    API client, UI kit, layout shells, toasts, formatting, validation
server/                      Express 5 API on 127.0.0.1:4000, run with tsx
  routes/ → services/ → repositories/ → db/ (better-sqlite3, file data/buggy-store.db)
  middleware/                Auth (bearer token sessions), latency, logging, error handling
  scripts/reset-db.ts        npm run db:reset
e2e/                         Playwright: baseline/, defects/, support/
docs/                        Requirements, SBT charter, facilitator guide, defect answer key
reference_doc/               Testing checklist (manual_test.md) and the original project brief
```

The browser only talks to the web server; `/api/*` is proxied to the API process (see
`vite.config.ts`). Product validation rules live in
`src/domains/products/domain/product.rules.ts` and are used by both the form and the API.

### API

All endpoints are JSON under `/api`. Errors use `{ "error": { "code", "message", "details": [{ "field", "message" }] } }`.

| Method | Path                        | Auth  | Notes                                                                |
| ------ | --------------------------- | ----- | -------------------------------------------------------------------- |
| GET    | `/api/health`               | –     | Liveness                                                             |
| POST   | `/api/auth/login`           | –     | `{ email, password }` → `{ token, expiresAt, user }`                 |
| GET    | `/api/auth/me`              | User  | Current session                                                      |
| POST   | `/api/auth/logout`          | User  | 204                                                                  |
| POST   | `/api/auth/forgot-password` | –     | `{ email }`; mock, no email is sent                                  |
| GET    | `/api/products`             | User  | `search, category, status, sort, order, page, pageSize (5/10/25/50)` |
| GET    | `/api/products/:id`         | User  |                                                                      |
| POST   | `/api/products`             | Admin | 201 · 400 validation · 409 duplicate SKU                             |
| PUT    | `/api/products/:id`         | Admin |                                                                      |
| DELETE | `/api/products/:id`         | Admin | 204                                                                  |
| GET    | `/api/dashboard/summary`    | User  | Totals, low stock, inventory value, five newest products             |

Authenticated requests send `Authorization: Bearer <token>`. The browser keeps the token in
`localStorage` (`buggy-store.token`).

### Database

SQLite file `data/buggy-store.db` (git-ignored), with tables `users`, `sessions`, `products`
(price stored as integer cents) and `password_reset_requests` (the mock email outbox). The schema
and seed data are in `server/db/`. A missing or outdated database is rebuilt automatically;
`npm run db:reset` rebuilds it on demand. All SQL uses bound parameters; sort columns come from a
whitelist.

### Configuration (environment variables)

| Variable              | Default               | Purpose                                                      |
| --------------------- | --------------------- | ------------------------------------------------------------ |
| `API_PORT`            | `4000`                | API port (the web server proxies to it)                      |
| `DB_FILE`             | `data/buggy-store.db` | SQLite file                                                  |
| `API_LATENCY_MS`      | `300`                 | Artificial delay per API call (makes loading states visible) |
| `SESSION_TTL_MINUTES` | `60`                  | Session lifetime                                             |
| `ENABLE_TEST_ROUTES`  | off                   | `1` enables `/api/test/*` reset helpers (Playwright only)    |

## Troubleshooting

| Symptom                                             | Fix                                                                                 |
| --------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `Port 5173 is already in use` / `Port 4000 …`       | Stop the other process, or set `API_PORT`; the web port is set in `vite.config.ts`. |
| UI shows "The server is not responding"             | The API isn't running: start it with `npm run start:api` (or use `npm start`).      |
| `better-sqlite3` fails to load after a Node upgrade | `npm rebuild better-sqlite3`                                                        |
| Data looks wrong or you're locked out               | `npm run db:reset`                                                                  |
| Playwright: "Executable doesn't exist"              | `npx playwright install chromium`                                                   |
| e2e: port 4100 or 4174 in use                       | A previous test run is still alive; stop it and retry.                              |

## Documents

| File                             | Audience         | Contents                                                       |
| -------------------------------- | ---------------- | -------------------------------------------------------------- |
| `docs/requirements.md`           | Participants     | Acceptance criteria to test against                            |
| `docs/session-test-charter.md`   | Participants     | Mission, areas, session log and bug report templates           |
| `reference_doc/manual_test.md`   | Participants     | QA checklist (coverage model) with Buggy Store notes           |
| `docs/facilitator-guide.md`      | Facilitator only | Running the session                                            |
| `docs/defect-answer-key.md`      | Facilitator only | Every seeded defect, traceability matrix, evidence             |
| `reference_doc/bug-reference.md` | Facilitator only | Each bug: what, where (screen + code line), how to find, steps |

## Code quality tooling

TypeScript strict mode (plus `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` and more),
ESLint with type-aware `strictTypeChecked` and React rules (fails on any warning), Prettier (with
Tailwind class sorting) and ArchGuard architecture checks. lint-staged runs ESLint and Prettier on
staged files at commit time. See `CLAUDE.md` for details.
