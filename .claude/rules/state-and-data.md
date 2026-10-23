---
paths:
  - 'src/**'
---

# State, data fetching and forms

ArchGuard cannot check these; they come from bugs fixed in other 7Edge projects.

## Where state lives

| What                                           | Where                                                       |
| ---------------------------------------------- | ----------------------------------------------------------- |
| Form values, loading flags, modal open/close   | `useState` in the component or its hook                     |
| Multi-step form drafts that survive navigation | A store with session-storage persistence, inside the domain |
| Cross-screen UI preferences                    | A global store                                              |
| Navigation helpers (back links, breadcrumbs)   | React Context                                               |

A global store is never used for form state. Redux Toolkit (`@reduxjs/toolkit` + `react-redux`)
was added on 2026-10-23 for the cart. Add a slice to `src/store/store.ts` only for state that
several screens share; ask before adding another state library.

## Redux

- One slice per feature, inside its domain (`src/domains/cart/application/cartSlice.ts`):
  reducers and selectors live in the slice (`createSlice({ reducers, selectors })`).
- Components read with `useAppSelector(selectX)` and write with `useAppDispatch()(action())`
  (typed hooks in `src/hooks/`). Never plain `useSelector`/`useDispatch`.
- Components that touch the store live in the domain's `presentation/`, not in
  `src/components/` (ArchGuard `no-store-in-shared-component`). Shared components take the
  connected part as a prop/slot (e.g. `ProductCard`'s `action`, `Header`'s `actions`).
- `src/store/store.ts` imports the domain's `application/` and `infrastructure/` barrels, not the
  domain root `index.ts`: the root also exports components, which import the typed hooks, which
  import the store's types (a cycle).
- Tests: render with `<AppProviders store={setupStore({ cart: ... })}>`; `setupStore()` gives a
  fresh store per test.

## Filter popups: pending vs applied

Filters in a popup are staged. Keep two state values:

```
pending → changes on every checkbox/dropdown change (not sent to the API)
applied → set from pending only on "Apply" (drives the API call and the badge count)
open    → seed pending from applied
close   → reset pending to applied (discard unsaved changes)
clear   → reset both, close
```

Pass `pending` to the controls and `applied` to the request and the badge. Binding a control
directly to the state used by the API call is a bug: closing without Apply leaves stale
selections visible on the next open.

## API calls

- All HTTP goes through one client module in `src/shared/` (auth header, refresh, error
  handling in one place). Domain code calls it from `application/` services
  (`<name>.service.ts`), never `fetch`/axios directly in components or hooks.
- Each API function has typed `Input` / `Result` types. Results are a discriminated union
  such as `{ error: false; data: T } | { error: true; status?: number; details?: FieldError[] }`
  so callers must narrow before touching `data`.
- No floating promises (lint-enforced): `await` it, or mark fire-and-forget with `void`.

## Validation

Shared field schemas (email, phone, name, page sizes) live in one module under `src/shared/`
and are imported, not redefined per form.

## Success messages after navigation

Pass the message in router location state and have the destination page read it once and
clear it, so it does not reappear on refresh or back-navigation.
