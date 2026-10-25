# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

**Buggy Store**: a product-management demo app for manual/exploratory/session-based testing
workshops. It **intentionally contains 33 seeded defects** (BUG-001…BUG-033).

- **Do not fix, "clean up" or refactor away a seeded defect** unless the user explicitly asks.
  Before changing behaviour in `src/` or `server/`, check `docs/defect-answer-key.md` (each entry
  has a _Location_); `e2e/defects/` asserts the correct behaviour and is expected to fail.
- Any other bug is accidental: fix it, and keep `npm run test:e2e` at 42 baseline passes + 33
  expected defect failures.
- `reference_doc/bug-reference.md` is a facilitator quick lookup (bug, screen, code `file:line`,
  repro steps). If you move code that a seeded defect lives in, update its line links there.
- Never link the answer key, bug reference, facilitator guide or defect tests from the app or participant docs
  (`docs/requirements.md`, `docs/session-test-charter.md`, `reference_doc/manual_test.md`).

## Stack

React 19 + TypeScript (strict) + Vite 8 + Tailwind CSS v4 + React Router 7 (declarative
`BrowserRouter`). Node >= 20.19 (pinned dependency versions must keep supporting Node 20).
Entry: `index.html` -> `src/main.tsx` -> `src/App.tsx` (routes). No state library.

API: `server/` (Express 5 + better-sqlite3, run with `tsx`, no build step) on 127.0.0.1:4000;
Vite dev and preview proxy `/api` to it. Layers: `routes/` -> `services/` -> `repositories/` ->
`db/`. The server imports pure modules from `src/domains/*/domain/` and `src/shared/validation/`
(shared types and validation rules); those files must stay free of browser/React imports.
SQLite file `data/buggy-store.db` (git-ignored, auto-created and seeded).

Tests: Playwright (`playwright.config.ts`, `e2e/`). The suite starts its own API (port 4100,
`data/e2e.db`, `ENABLE_TEST_ROUTES=1`) and a production build (port 4174), and resets the DB before
every test via `POST /api/test/reset`.

## Commands

```bash
npm run dev           # API (tsx watch) + Vite dev server, via concurrently
npm start             # vite build, then API + vite preview (demo mode), port 5173
npm run db:reset      # restore the 16-product demo dataset (db:reset:large = 316 products)
npm run test:e2e      # Playwright: expect 75 passed (42 baseline + 33 expected defect failures)
npm run build         # tsc -b, then vite build
npm run typecheck     # tsc -b (references: tsconfig.app/node/server/e2e.json)
npm run lint          # eslint, fails on ANY warning (--max-warnings=0)
npm run lint:fix
npm run format        # prettier --write (also sorts Tailwind classes)
npm run check         # typecheck + lint + format:check — run this before declaring work done
npm run arch          # ArchGuard architecture check (naming, layers, reuse)
npm run arch:analyze  # rebuild the .archguard/ cache used by the MCP server
```

There is no unit-test runner; `npm test` does not exist. `BUGGY_STORE_BASELINE=1 npm run test:e2e`
runs the defect tests as normal tests (for a build without the seeded defects).

## Best practices and ArchGuard

Project conventions live in `.claude/rules/` (loaded automatically when working in `src/`):
`architecture.md` (domain/layer layout, naming, reuse), `state-and-data.md` (state placement,
filter popups, API client, validation), `styling.md` (tokens, shared wrappers), `server.md`
(API layering), `e2e.md` (Playwright conventions). When a new pattern is agreed on, add it there,
not only in a conversation.

ArchGuard specifics learned here: presentation may not import a `domain/` folder (not even types),
so each `application/index.ts` re-exports what presentation needs; cross-domain imports are errors
even through barrels, so `src/App.tsx` composes domains and passes role flags as props; every file
in `application/` needs a `.service.ts` suffix. The three `structure/feature-folder` warnings on
`src/domains/*/index.ts` come from the scaffold's own barrel layout and are accepted.

ArchGuard is vendored as a prebuilt package in `packages/arcguard/` (installed via
`"@7edge/arcguard": "file:./packages/arcguard"`; do not edit its `dist/`, update it by copying a
new build from the ArchGuard repo). Config: `arcguard.config.json`. `.mcp.json` registers it as
the `arcguard` MCP server (approve it on first launch); use its `scaffold` tool to create files and
`validate_file` after editing them.

## Commit hooks

`npm install` runs `prepare` -> `husky`. lint-staged (config in `package.json`) runs
`eslint --fix --max-warnings=0` + `prettier --write` on staged TS/JS, and `prettier --write` on
json/css/md/html/yml. Note: `.husky/pre-commit`, `.nvmrc` and `.vscode/` are not present in the
repo, so the hook only runs once someone adds `.husky/pre-commit`.

## Strictness rules that affect how code must be written

TypeScript (`tsconfig.app.json` covers `src/`; `tsconfig.server.json` covers `server/`;
`tsconfig.e2e.json` covers `e2e/` + `playwright.config.ts`; `tsconfig.node.json` covers
`vite.config.ts`):

- `noUncheckedIndexedAccess`: array/record index access returns `T | undefined` — narrow it.
- `exactOptionalPropertyTypes`: you cannot pass `undefined` to an optional prop unless its type
  includes `| undefined`.
- `noPropertyAccessFromIndexSignature`: use `obj['key']` for index-signature types.
- `verbatimModuleSyntax` + `erasableSyntaxOnly`: no `enum`, no `namespace`, no constructor
  parameter properties; type-only imports must use `import type`.
- `allowImportingTsExtensions`: local imports include the extension (e.g. `import App from './App.tsx'`).
- React 19.3 types: use `SubmitEvent` (not the deprecated `FormEvent`) and `use(Context)` (not
  `useContext`). react-hooks 7 also forbids reading `ref.current` during render and calling a
  state setter synchronously inside an effect body.

ESLint (`eslint.config.js`, type-aware via `projectService`):

- typescript-eslint `strictTypeChecked` + `stylisticTypeChecked`, `react-x` strict-type-checked,
  `react-dom` strict, react-hooks, react-refresh (components files should only export components).
- Explicit return types on functions (e.g. components return `React.JSX.Element`, handlers `void`).
- `consistent-type-imports` with separate `import type` statements.
- `eqeqeq`, `curly: all`, no `any`, no floating promises, exhaustive `switch` on unions.
- `no-console` except `console.warn`/`console.error`.
- Unused vars/args allowed only with a `_` prefix.

Prettier: no semicolons, single quotes, trailing commas, 100-col width, LF.

## Styling

Tailwind v4 via `@tailwindcss/vite` — there is no `tailwind.config.js`. Design tokens live in the
`@theme` block in `src/index.css` (e.g. `--color-brand` -> `bg-brand`, `text-brand`). Add new
tokens there rather than hard-coding colors. Prettier's Tailwind plugin reads this stylesheet to
sort classes.
