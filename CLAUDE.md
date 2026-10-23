# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack

React 19 + TypeScript (strict) + Vite 8 + Tailwind CSS v4. Node >= 20.19. Single-page app with
one entry point: `index.html` -> `src/main.tsx` -> `src/App.tsx`. Redux Toolkit holds the cart
(see `## Cart (Redux)`); everything else is local state or context.

Routing is React Router v8 in data mode. The route table is `ROUTES` in `src/routes.ts` (shared by
`createBrowserRouter` in `App.tsx` and `createMemoryRouter` in tests); pages live in `src/pages/`.
In v8 `RouterProvider` is imported from `react-router/dom`, everything else from `react-router`
(`react-router-dom` no longer exists). Keep the route file `.ts`: ArchGuard treats every `.tsx`
file as a component and requires a PascalCase name.

## API and environment

`VITE_API_BASE_URL` (typed in `src/env.d.ts`) is the API base URL. Copy `.env.example` to `.env.local`
(git-ignored via `*.local`). DummyJSON stands in for the real API. All HTTP goes through
`apiPost` in `src/shared/httpClient.ts`, which returns an `ApiResult<T>` union and adds the bearer
token from `src/helpers/tokenStorage.ts`. `src/services/authService.ts` narrows the JSON; it does
not store tokens (AuthProvider does). Tests stub `fetch` and the env with `vi.stubGlobal` / `vi.stubEnv`, which Vitest
undoes after each test (`unstubGlobals`/`unstubEnvs` in `vite.config.ts`).

## Auth

`AuthProvider` (`src/context/AuthProvider.tsx`, wraps the router in `App.tsx`) holds the user;
read it with `useAuth()` (`src/context/useAuth.ts`). The context object and types are in
`src/context/AuthContext.ts`. They are three files because react-refresh lint and ArchGuard's
`naming/hook-prefix` both reject a hook exported next to a component. On load, a saved token is
checked with `GET /auth/me` (status `restoring`); a failure clears it. `ProtectedRoute` is a
layout route in `ROUTES`: put private pages in its `children`. Tests that render pages using
`useAuth` must wrap them in `<AuthProvider>`.

Logged-in pages are children of `AppLayout` (`src/components/layout/`: full-height sidebar with
logo, nav, Settings/Logout and the user chip; header with the page title and bell; the page in
`<main>`) inside `ProtectedRoute` in `ROUTES`. Each of those routes sets `handle: { title }`, which
the header shows (`getRouteTitle` in `src/helpers/routeTitle.ts`). A new private page needs a route
there and, if it belongs in the menu, an entry in `MAIN_NAV` in `Sidebar.tsx`; unbuilt menu pages use
`ComingSoonPage`. Pages render a `<section>` with one `<h1>`, not their own `<main>`. `/login` and `/signup` sit under
`AuthLayout` (logo, support link, marketing panel from `lg` up, footer); placeholder support,
privacy and terms URLs are in `src/helpers/siteLinks.ts`. Below `md` the
sidebar is an off-canvas drawer. Shared UI: `Button`, `SearchInput`, `EmptyState`, `Logo` and the
inline SVG icons in `src/components/icons/` (logo, icons and illustrations are approximations until
the Figma assets are exported).

## Products

- `/products` (`ProductsPage`, `useProductList`): card grid, debounced search, category filter popup
  (`CategoryFilter`, staged pending/applied), 10 per page. Paths are built in
  `productListService.ts`; DummyJSON cannot search inside a category, so a filtered category is
  loaded whole and searched/paged client-side. Card ⋮ menu: View, Edit, Delete (`Modal` confirm,
  `DELETE /products/:id`; DummyJSON does not really delete, so the card is hidden locally). The
  whole card links to the detail page (stretched `::after` on the name link); the ⋮ menu and the
  card `action` sit above it with z-index.
- `/products/:id` (`ProductDetailPage`): `ImageCarousel`, `ProductDetailsList` (fields DummyJSON lacks
  show "n/a"), `VendorsPanel` (tabs + empty state; no vendor API yet). Detail and edit share
  `ProductLoadState` for loading / not found / error.
- `/products/new` and `/products/:id/edit` reuse `ProductForm` (`mode: 'add' | 'edit'`). Rules live in
  `src/helpers/validators.ts` (JPG/PNG/WebP, max 2 MB, up to `MAX_PRODUCT_IMAGES` = 4). Picked images
  are `Blob[]` in form state; `ImageUpload` shows a large preview plus four slots, a thumbnail's ×
  opens the "Attention" modal (Remove / Replace), and pick rules are in `imagePicks.ts`. `BlobImage`
  creates and revokes object URLs inside one effect (StrictMode-safe). Both pages submit through
  `useProductSubmit` with `buildProductFormData` (one `images` entry per file); FormData goes as
  multipart without setting Content-Type.
- Success returns to `/products` with `{ title, message }` in location state (`flashMessage.ts`),
  shown once in the success `Modal` (Cancel / Home). DummyJSON does not persist writes: add always
  returns id 195.

## Cart (Redux)

`src/domains/cart/` (domain / application / infrastructure / presentation, `index.ts` barrel):
`cartSlice` (add, decrement, remove, clear; count/total/quantity selectors), `cartStorage`
(localStorage), and `AddToCartButton`, `CartItemRow`, `CartLink` (header badge). The store is
built in `src/store/store.ts`; `App.tsx` uses `createPersistedStore()` (saved cart, saved again on
change). `AppProviders` wraps Redux `Provider` + `AuthProvider`; page tests render with it. `/cart` is
`CartPage`. Conventions are in `.claude/rules/state-and-data.md`. ArchGuard keeps two warnings on
purpose: `cartSlice.ts` is a slice, not a `.service`, and the domain `index.ts` barrel is required
by `architecture.md`.

## Loading states

No "Loading…" text: use shimmer skeletons. `Skeleton` (one block, `SHIMMER_CLASSES` in
`components/shimmer.ts`, `animate-shimmer` keyframes in `index.css`) inside `LoadingRegion`
(one screen-reader announcement). Page-shaped ones are in `ProductSkeletons.tsx` and
`layout/AppShellSkeleton.tsx`; `ProductImage` shimmers until the photo loads.

## Commands

```bash
npm run dev           # Vite dev server
npm run build         # tsc -b, then vite build
npm run typecheck     # tsc -b (project references: tsconfig.app.json + tsconfig.node.json)
npm run lint          # eslint, fails on ANY warning (--max-warnings=0)
npm run lint:fix
npm run format        # prettier --write (also sorts Tailwind classes)
npm run check         # typecheck + lint + format:check — run this before declaring work done
npm run test          # Vitest in watch mode
npm run test:run      # Vitest, single run (CI)
npm run arch          # ArchGuard architecture check (naming, layers, reuse)
npm run arch:analyze  # rebuild the .archguard/ cache used by the MCP server
```

Tests use Vitest + jsdom + Testing Library (config in the `test` block of `vite.config.ts`).
Test files sit next to the source as `*.test.tsx`. `src/setupTests.ts` loads the jest-dom
matchers and runs `cleanup()` after each test (Vitest globals are off, so import `describe`/`it`/
`expect` from `vitest`). The setup file is not under a `test/` folder because ArchGuard's
`naming/test-suffix` rule would flag it.

The system npm (9.2.0) and npm 10 crash with `Cannot read properties of null (reading
'edgesOut')` when adding `vitest` to this tree; `vitest` was added with
`npx npm@10 install -D -E vitest --legacy-peer-deps`. Plain `npm install` works.

## Best practices and ArchGuard

Project conventions live in `.claude/rules/` (loaded automatically when working in `src/`):
`architecture.md` (domain/layer layout, naming, reuse), `state-and-data.md` (state placement,
filter popups, API client, validation), `styling.md` (tokens, shared wrappers). When a new
pattern is agreed on, add it there, not only in a conversation.

ArchGuard is vendored as a prebuilt package in `packages/arcguard/` (installed via
`"@7edge/arcguard": "file:./packages/arcguard"`; do not edit its `dist/`, update it by copying a
new build from the ArchGuard repo). Config: `arcguard.config.json`. `.mcp.json` registers it as
the `arcguard` MCP server (approve it on first launch); use its `scaffold` tool to create files and
`validate_file` after editing them.

## Commit hooks

`npm install` runs `prepare` -> `husky`. lint-staged (config in `package.json`) runs
`eslint --fix --max-warnings=0` + `prettier --write` on staged TS/JS, and `prettier --write` on
json/css/md/html/yml. The README says the pre-commit hook also runs `tsc -b`. Note: the README
references `.husky/pre-commit`, `.nvmrc`, and `.vscode/` but these are not present in the repo
yet.

## Strictness rules that affect how code must be written

TypeScript (`tsconfig.app.json`, covers `src/` only; `tsconfig.node.json` covers `vite.config.ts`):

- `noUncheckedIndexedAccess`: array/record index access returns `T | undefined` — narrow it.
- `exactOptionalPropertyTypes`: you cannot pass `undefined` to an optional prop unless its type
  includes `| undefined`.
- `noPropertyAccessFromIndexSignature`: use `obj['key']` for index-signature types.
- `verbatimModuleSyntax` + `erasableSyntaxOnly`: no `enum`, no `namespace`, no constructor
  parameter properties; type-only imports must use `import type`.
- `allowImportingTsExtensions`: local imports include the extension (e.g. `import App from './App.tsx'`).

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
