---
paths:
  - 'src/**'
---

# Architecture, naming and reuse

These rules are enforced by ArchGuard (`packages/arcguard`, config in `arcguard.config.json`).
Do not restate them in review comments; run the tool.

## Workflow

- Before creating a component, hook, service or new domain, use the `arcguard` MCP `scaffold`
  tool (or `npx arcguard scaffold <component|hook|service|module> <name> --domain <domain>`)
  so the file lands in the right layer with the right name.
- After editing a file under `src/`, call the MCP `validate_file` tool on it, or run
  `npm run arch` before finishing. Errors must be fixed; warnings need a reason to keep.
- `get_violations` / `get_violations_summary` give the current state; `npm run arch:analyze`
  refreshes the `.archguard/` cache if MCP results look stale.

## Folder layout

Feature code lives in domains, each split into layers:

```
src/domains/<domain>/
  presentation/    # components, pages: render only
  application/     # hooks and use-cases that orchestrate domain + infrastructure
  domain/          # types, pure business rules: imports nothing outward
  infrastructure/  # API calls, storage, external SDKs
  index.ts         # barrel: the only entry point other code may import
src/shared/        # cross-domain UI and utilities, no domain knowledge
```

- Allowed dependencies: presentation → application → domain; infrastructure → domain.
  Presentation never imports infrastructure directly.
- A domain never imports another domain's internals. Go through its `index.ts`, or move the
  shared piece to `src/shared/`.
- No circular imports. Max folder depth is 6.
- No API calls or business logic in presentation files: move them into an `application/` hook.

## Naming

| Kind              | Rule                                               |
| ----------------- | -------------------------------------------------- |
| Component files   | PascalCase `.tsx` (`UserCard.tsx`)                 |
| Hooks             | `use` prefix (`useUserList.ts`)                    |
| Services          | `.service` suffix (`user.service.ts`)              |
| Tests             | `.test.ts(x)` or `.spec.ts(x)`, next to the source |
| Exported literals | `SCREAMING_SNAKE_CASE` (`MAX_RETRIES`)             |
| Context files     | end in `Context` (`AuthContext.tsx`)               |

`enum` is a compile error here (`erasableSyntaxOnly`). Use an `as const` object plus a derived
union type instead.

## Reuse

- Every exported component declares a `Props` interface/type, even if it is empty.
- Components stay under 200 lines. Split before adding more.
- Components in `src/shared/` never import a store (Redux/Zustand/etc.); pass data via props.
- No `style={{ }}`: use Tailwind classes and theme tokens (see `styling.md`).
- Before writing a new component or helper, search `src/shared/` for an existing one. ArchGuard
  flags copy-pasted blocks across files.
