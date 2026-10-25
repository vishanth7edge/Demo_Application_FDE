---
paths:
  - 'server/**'
---

# API server

- Layering: `routes/` (HTTP only: parse params, call a service, send JSON) → `services/`
  (validation, business rules, throws `HttpError`) → `repositories/` (SQL only) → `db/`.
- All SQL uses bound parameters. Anything interpolated into SQL (sort columns) must come from a
  whitelist object in the repository.
- Request input is `unknown`: read it with `server/lib/request.ts` helpers, never cast `req.body`.
- Validate with the shared rules in `src/domains/products/domain/product.rules.ts` and
  `src/shared/validation/email.ts` so the form and the API agree.
- Errors: throw `HttpError(status, code, message, details)`; `errorHandler` turns it into
  `{ error: { code, message, details } }`. Unknown errors become a generic 500.
- `requireAuth(db)` resolves the bearer token; `getSession(req)` reads it; `requireRole('admin')`
  guards writes.
- Schema changes go in `server/db/schema.ts`; bump `SCHEMA_VERSION` so old demo databases rebuild.
  Seed values are quoted in `docs/defect-answer-key.md`: change both together.
- Bind to 127.0.0.1 only: the app contains deliberate security defects.
