# Buggy Store: defect answer key (FACILITATOR ONLY)

> **Do not share this file with participants.** It lists every seeded defect, how to reproduce it
> and where it lives in the code. The application never links to it. If participants get a copy of
> the repository, remove `docs/defect-answer-key.md`, `docs/facilitator-guide.md`,
> `reference_doc/bug-reference.md` and `e2e/defects/` first.

- Defects seeded: **33** (BUG-001 to BUG-033), each with a distinct root cause.
- Verified: **33 of 33**, by automated end-to-end tests (`e2e/defects/`) that assert the _expected_
  behaviour and fail on the seeded build (Playwright reports them as expected failures). The same
  tests pass on the defect-free baseline build, which shows that each failure comes from the defect,
  not from the test.
- Requirements oracle given to participants: [`docs/requirements.md`](requirements.md). Every
  defect contradicts at least one requirement ID listed below.
- Checklist: [`reference_doc/manual_test.md`](../reference_doc/manual_test.md), sections §1–§16.

## Summary inventory

Difficulty: **E** easy (found by most testers), **M** medium (needs a deliberate technique), **H**
hard (needs combined actions, DevTools or careful calculation).

| ID      | Title                                                       | Area           | Severity | Diff. | Requirement | Checklist §     |
| ------- | ----------------------------------------------------------- | -------------- | -------- | ----- | ----------- | --------------- |
| BUG-001 | Sign-in rejects an email with surrounding spaces            | Sign in        | Medium   | M     | AUTH-2      | 3, 5            |
| BUG-002 | After sign-in, user always lands on Dashboard               | Sign in        | Medium   | M     | AUTH-6      | 1, 6, 15        |
| BUG-003 | Logout does not end the session on the server               | Session        | High     | H     | AUTH-9      | 6, 9, 15        |
| BUG-004 | Forgot password reveals whether an account exists           | Forgot pwd     | Medium   | E     | PWD-2       | 1, 2, 13, 15    |
| BUG-005 | Valid email with "+" rejected                               | Forgot pwd     | Medium   | E     | PWD-1       | 3, 5            |
| BUG-006 | Low stock card ignores products with exactly 10 units       | Dashboard      | Medium   | M     | Dashboard   | 1, 3, 7         |
| BUG-007 | Inventory value drops the cents of every price              | Dashboard      | High     | H     | Dashboard   | 1, 2, 7         |
| BUG-008 | Dashboard shows zeros instead of an error when API fails    | Dashboard      | High     | M     | DASH-2      | 7, 9, 13, 16    |
| BUG-009 | Search only matches a complete, exact-case SKU              | Product list   | Medium   | M     | LIST-3      | 2, 3            |
| BUG-010 | Price and Stock sort as text, not numbers                   | Product list   | Medium   | E     | LIST-6      | 2, 3, 7         |
| BUG-011 | Category + Status filters combine with OR                   | Product list   | High     | M     | LIST-5      | 2, 3            |
| BUG-012 | Sorting by Status fails (400 + console error)               | Product list   | Medium   | E     | LIST-6      | 2, 9, 13, 16    |
| BUG-013 | Search sends one request per keystroke                      | Product list   | Low      | M     | LIST-4      | 9, 11           |
| BUG-014 | Deleting the last row on the last page leaves an empty page | Product list   | Medium   | M     | LIST-8      | 3, 7, 11        |
| BUG-015 | Row Delete button has no accessible name or tooltip         | Product list   | Medium   | M     | NFR-2       | 4, 12           |
| BUG-016 | "Discontinued" badge is green                               | Product list   | Low      | E     | LIST-7      | 1, 4            |
| BUG-017 | Table cut off on tablet/mobile; Actions unreachable         | Product list   | Medium   | E     | LIST-11     | 4, 10           |
| BUG-018 | Price of $0.00 accepted                                     | Product form   | Medium   | E     | Form rules  | 3, 5            |
| BUG-019 | Fractional quantity (e.g. 2.5) accepted                     | Product form   | Medium   | E     | Form rules  | 3, 5            |
| BUG-020 | Name of only spaces accepted (saved blank)                  | Product form   | Medium   | E     | Form rules  | 5, 7            |
| BUG-021 | Names of 81–100 characters fail with a generic error        | Product form   | Medium   | M     | FORM-2      | 3, 5, 9, 13, 16 |
| BUG-022 | Double-click on Create product submits twice                | Product form   | Medium   | M     | FORM-3      | 2, 4, 9         |
| BUG-023 | Price error message overlaps the hint text                  | Product form   | Low      | E     | FORM-1      | 4, 10           |
| BUG-024 | `& < > " '` are HTML-escaped on save and grow on each edit  | Product form   | High     | M     | FORM-4      | 5, 7, 14, 15    |
| BUG-025 | Status change is not saved, but success is shown            | Edit           | High     | M     | FORM-5      | 2, 7            |
| BUG-026 | Edit allows a duplicate SKU that differs only in case       | Edit           | High     | H     | Form rules  | 2, 3, 5, 7      |
| BUG-027 | Detail/edit pages show stale data after saving              | Edit           | Medium   | E     | FORM-5      | 6, 7            |
| BUG-028 | "Products" breadcrumb on Edit page opens the Dashboard      | Edit           | Low      | E     | NAV-2       | 6               |
| BUG-029 | Cancel one delete, confirm another: wrong product deleted   | Delete         | Critical | H     | DEL-1       | 2, 7            |
| BUG-030 | Delete dialog overflows with a long name on phones          | Delete         | Low      | M     | NFR-1       | 4, 10           |
| BUG-031 | Unknown product id spins forever                            | Product detail | Medium   | E     | DET-3       | 4, 13, 15       |
| BUG-032 | Viewer sees Edit and Delete on the product detail page      | Roles          | Medium   | M     | ROLE-1      | 8               |
| BUG-033 | Logout cannot be reached or used with the keyboard          | Accessibility  | Medium   | M     | NFR-2       | 12              |

Severity spread: 1 Critical, 7 High, 20 Medium, 5 Low. Difficulty spread: 13 easy, 16 medium, 4 hard.

## How to use this key during the session

1. Reset the data before each group: `npm run db:reset`.
2. When a participant reports a bug, match it by **symptom** to the table above; several defects can
   produce similar first impressions (see [Interactions](#interactions-between-defects)).
3. Count a report as a hit when the steps reproduce and the expected result cites the requirement.
   Reports that match [Not defects](#expected-behaviour-that-is-not-a-defect) are good questions,
   not bugs.
4. Award a bonus for reports that identify the _cause class_ (validation, calculation, state, API).

---

## Defect details

Each entry lists: module, severity with rationale, preconditions, steps, expected and actual
results, technique, checklist sections, evidence, verification and code location. Unless stated
otherwise, preconditions are "freshly reset data, signed in as the administrator, desktop width".

### BUG-001: Sign-in rejects an email with surrounding spaces

- **Module / feature:** Authentication › Sign in form and `POST /api/auth/login`
- **Severity:** Medium. Users who paste their address (a common habit) are locked out with a
  misleading "Invalid email or password"; workaround is to retype it.
- **Preconditions:** Signed out.
- **Steps:**
  1. Open `/login`.
  2. Email: `admin@buggystore.test` (one leading and one trailing space, or paste it with a
     trailing space). Password: `Admin@123`.
  3. Click **Sign in**.
- **Expected:** Signed in and taken to the Dashboard (AUTH-2: surrounding spaces are ignored).
- **Actual:** Red alert "Invalid email or password."; stays on `/login`. Upper-case letters _do_ work,
  which makes the space rule easy to miss.
- **Technique:** Equivalence partitioning (whitespace variants of a valid value); copy/paste testing.
- **Checklist:** §5 Input Validation (leading/trailing spaces, copy/paste); §3 EP.
- **Evidence:** Screenshot of filled form plus alert; Network tab shows the request body with the
  spaces and a 401 response.
- **Verified:** Yes. `BUG-001 sign-in accepts an email pasted with surrounding spaces` fails: URL stays
  `/login`.
- **Location:** `server/services/auth.service.ts` › `normalizeEmail()` lower-cases but does not trim.
- **Fix:** `email.trim().toLowerCase()`.

### BUG-002: After sign-in, the user always lands on the Dashboard

- **Module / feature:** Authentication › redirect after sign-in (deep links)
- **Severity:** Medium. Bookmarked or shared links (with filters) are lost, so users have to
  navigate again; no data impact.
- **Preconditions:** Signed out.
- **Steps:**
  1. Open `http://localhost:5173/products?category=Electronics` directly.
  2. You are redirected to Sign in. Sign in as the administrator.
- **Expected:** Return to `/products?category=Electronics` with the Electronics filter applied (AUTH-6).
- **Actual:** Always lands on `/dashboard`. The redirect to Sign in does remember the page (visible in
  `history.state`), but it is ignored.
- **Technique:** State-transition / navigation testing; deep-link testing.
- **Checklist:** §6 Navigation (redirects); §15 Restricted page access; §1 acceptance criteria.
- **Evidence:** Short screen recording showing the typed URL, the redirect and the final URL.
- **Verified:** Yes. `BUG-002 …` fails: final URL `/dashboard`.
- **Location:** `src/domains/auth/presentation/RouteGuards.tsx` › `RedirectIfAuthenticated` navigates
  to `/dashboard` instead of `getPostLoginPath(location.state)` (the helper exists in
  `auth.service.ts` but is unused).
- **Fix:** `<Navigate to={getPostLoginPath(location.state)} replace />`.

### BUG-003: Logout does not end the session on the server

- **Module / feature:** Session › Logout (`POST /api/auth/logout`)
- **Severity:** High. A security weakness: a token taken before logout keeps working until it
  expires (60 minutes), and other tabs stay fully usable after the user believes they signed out.
- **Preconditions:** Signed in as the administrator in tab A.
- **Steps:**
  1. Open a second tab (B) on `/products` (same browser, so the same session).
  2. In tab A click **Logout**. Tab A shows Sign in.
  3. In tab B click **Dashboard** in the sidebar, or edit a product and save.
- **Expected:** Tab B's next action is rejected and it returns to Sign in (AUTH-9).
- **Actual:** Tab B keeps working: data loads and edits are saved. In DevTools, copying the token
  from tab B (Application › Local Storage › `buggy-store.token`) and calling `GET /api/auth/me`
  after logout still returns 200. The logout request itself returns 204, so it _looks_ successful.
- **Technique:** Multi-tab exploratory testing; state transition; API verification after logout.
- **Checklist:** §15 Security basics (session); §9 API status codes; §6 Navigation.
- **Evidence:** Screen recording with both tabs side by side; Network tab of tab B after logout
  (200 responses). Optionally a cURL request with the old token.
- **Verified:** Yes. `BUG-003 …` fails: tab B is still on `/dashboard`.
- **Location:** `server/routes/auth.routes.ts` › `POST /logout` passes the raw `Authorization` header
  (`"Bearer …"`) to `logout()`, so `DELETE … WHERE token = ?` matches no row.
- **Fix:** `logout(db, getSession(req).token)`.

### BUG-004: Forgot password reveals whether an account exists

- **Module / feature:** Forgot password (`POST /api/auth/forgot-password`)
- **Severity:** Medium. Account enumeration: anyone can test which email addresses are customers or
  staff. No direct data loss.
- **Preconditions:** Signed out.
- **Steps:**
  1. Open `/forgot-password`.
  2. Enter `nobody@buggystore.test` and click **Send reset link**.
  3. Repeat with `viewer@buggystore.test`.
- **Expected:** The same neutral confirmation for both (PWD-2).
- **Actual:** Unknown address shows "We couldn't find an account with that email address." (HTTP 404);
  a known address shows "Check your inbox". The difference reveals registered addresses.
- **Technique:** Equivalence partitioning (registered vs unregistered); security error guessing.
- **Checklist:** §15 Security basics; §13 Error messages; §2 Negative scenarios; §1 requirements.
- **Evidence:** Two screenshots side by side; Network tab showing 404 vs 200.
- **Verified:** Yes. `BUG-004 …` fails: "Check your inbox" never appears for the unknown address.
- **Location:** `server/routes/auth.routes.ts` › `POST /forgot-password` throws `ACCOUNT_NOT_FOUND`.
- **Fix:** Always respond 200 with the generic message.

### BUG-005: A valid email address containing "+" is rejected

- **Module / feature:** Forgot password › email validation (shared rule, also enforced by the API)
- **Severity:** Medium. Users with plus-addressing (common with Gmail and company aliases) cannot
  request a reset.
- **Preconditions:** Signed out.
- **Steps:**
  1. Open `/forgot-password`.
  2. Enter `qa+reset@buggystore.test` and submit.
- **Expected:** Accepted; confirmation shown (PWD-1 explicitly allows `+`).
- **Actual:** Field error "Enter a valid email address, for example name@company.com". `%` is rejected too.
- **Technique:** Equivalence partitioning: a less common member of the _valid_ class.
- **Checklist:** §3 EP; §5 Special characters.
- **Evidence:** Screenshot of the field error.
- **Verified:** Yes. `BUG-005 …` fails: confirmation not shown.
- **Location:** `src/shared/validation/email.ts` › `EMAIL_PATTERN` local part is `[A-Za-z0-9._-]`.
- **Fix:** Allow `%` and `+` in the local part.

### BUG-006: Low stock card ignores products with exactly 10 units

- **Module / feature:** Dashboard › Low stock card (`GET /api/dashboard/summary`)
- **Severity:** Medium. An inventory KPI under-reports items that need reordering; the list badges
  disagree with the dashboard.
- **Steps:**
  1. Open the Dashboard: **Low stock = 5**.
  2. On Products, choose 25 rows per page and count "Low stock"/"Out of stock" badges: **6**
     (EL-1002 8, EL-1004 0, **EL-1005 10**, HK-2003 3, OF-3003 4, SP-4002 0).
- **Expected:** 6. The card itself says "10 or fewer units in stock, including sold out".
- **Actual:** 5. Noise-Cancelling Headphones (10 units) is excluded. Editing any product to 10 units
  confirms it: the badge appears but the card does not change.
- **Technique:** Boundary value analysis at the threshold (9 / 10 / 11); consistency between views.
- **Checklist:** §3 BVA; §7 Data verification; §1 requirements.
- **Evidence:** Screenshot of the card plus the list filtered or sorted to show the 10-unit product.
- **Verified:** Yes. `BUG-006 …` fails: expected "6", received "5".
- **Location:** `server/repositories/dashboard.repository.ts` › `findSummaryCounts()` uses `quantity < ?`.
- **Fix:** `quantity <= ?`.

### BUG-007: Inventory value drops the cents of every price

- **Module / feature:** Dashboard › Inventory value card
- **Severity:** High. A financial figure is wrong (by $781.09 on the seed data) and looks
  plausible, so it would be trusted.
- **Steps:**
  1. Read **Inventory value** on the Dashboard: **$55,397.00**.
  2. Edit _Yoga Mat Pro 6mm_ ($39.99) and change quantity 64 → 65.
  3. Return to the Dashboard.
- **Expected:** Σ price × quantity = **$56,178.09** initially, then +$39.99.
- **Actual:** $55,397.00, then +$39.00. The total always ends in `.00`, because each price is
  truncated to whole dollars before multiplying.
- **Technique:** Calculation oracle; "change one thing" differential testing; data verification.
- **Checklist:** §7 Data verification; §2 Functional; §1 requirements.
- **Evidence:** Before/after screenshots plus the arithmetic; or a spreadsheet of the product list.
- **Verified:** Yes. `BUG-007 …` fails: expected "$56,178.09", received "$55,397.00".
- **Location:** `server/repositories/dashboard.repository.ts` ›
  `SUM(price_cents / 100 * quantity)` (SQLite integer division).
- **Fix:** `SUM(price_cents * quantity) / 100.0`.

### BUG-008: Dashboard shows zeros instead of an error when the API fails

- **Module / feature:** Dashboard › error handling
- **Severity:** High. During an outage the dashboard reports an empty store (0 products, $0.00)
  as if it were real data; the product list correctly shows an error.
- **Steps (either):**
  - DevTools › Network › **Offline**, then click **Dashboard** in the sidebar (don't reload).
  - Or stop the API process and click **Dashboard**.
- **Expected:** "We couldn't load the dashboard." with **Try again** (DASH-2).
- **Actual:** All four cards show 0 / $0.00 and "Recently added" says "No products yet". The only
  hint is a console error `[dashboard] Failed to load summary`.
- **Technique:** Error guessing / fault injection (network off, server down).
- **Checklist:** §13 Network failure; §9 API error handling; §16 Console; §7 Data verification.
- **Evidence:** Screenshot with the Network tab showing the failed request, and the console error.
- **Verified:** Yes. `BUG-008 …` fails: the error message never appears.
- **Location:** `src/domains/dashboard/presentation/useDashboardSummary.ts`: on error it stores
  `EMPTY_SUMMARY` as a ready state.
- **Fix:** Set the `error` state (the page already renders a RetryAlert for it).

### BUG-009: Search only matches a complete, exact-case SKU

- **Module / feature:** Product list › search (`GET /api/products?search=`)
- **Severity:** Medium. Partial SKU lookups (the most common warehouse workflow) find nothing.
- **Steps:**
  1. Search `EL-1001` → 1 result (works).
  2. Search `1001` or `el-1001` → "No products match your filters".
  3. Search `mouse` → name search works.
- **Expected:** Any part of the name or SKU, case-insensitive (LIST-3).
- **Actual:** The SKU only matches when the whole SKU is typed in exact case.
- **Technique:** Equivalence partitioning by field (name vs SKU) and by match type (full, partial,
  case).
- **Checklist:** §2 Functional; §3 EP.
- **Evidence:** Two screenshots (`EL-1001` vs `1001`) with the request URL.
- **Verified:** Yes. `BUG-009 …` fails: "No products match your filters" for `1001`.
- **Location:** `server/repositories/product.repository.ts` › `findProducts()`:
  `(name LIKE ? … OR sku = ?)`.
- **Fix:** `sku LIKE ? ESCAPE '\'` with the same pattern.

### BUG-010: Price and Stock columns sort as text

- **Module / feature:** Product list › sorting
- **Severity:** Medium. Sorted views are misleading (cheapest/most stocked are not first).
- **Steps:**
  1. Set 25 rows per page. Click **Price** (ascending).
- **Expected:** $9.99, $18.75, $22.50 … $1,249.00, $1,299.00.
- **Actual:** $119.00, $1,249.00, $1,299.00, $149.99, $18.75, $199.00 … $9.99 (sorted by the digits of
  the cent value). **Stock** is wrong the same way (0, 0, 10, 12, 142, 18, …). Name, Category and
  Created sort correctly.
- **Technique:** Sorting with values of different digit lengths; equivalence classes of column type.
- **Checklist:** §2 Functional; §3 Edge cases; §7 Data verification.
- **Evidence:** Screenshot of the sorted Price column.
- **Verified:** Yes. `BUG-010 …` fails: first value 119 instead of 9.99.
- **Location:** `server/repositories/product.repository.ts` › `ORDER BY lower(${column})` turns
  numbers into text (added to make text sorts case-insensitive).
- **Fix:** Use `COLLATE NOCASE` only on text columns.

### BUG-011: Category and Status filters combine with OR

- **Module / feature:** Product list › filters
- **Severity:** High. Combined filters return items that match neither intent, and the count looks
  authoritative.
- **Steps:**
  1. Category **Electronics** → 5 rows (correct). Status **Inactive** alone → 2 rows (correct).
  2. Select both.
- **Expected:** 1 row: USB-C Docking Station (EL-1004) (LIST-5).
- **Actual:** 6 rows: all Electronics **plus** Waterproof Rain Jacket (Apparel, Inactive). Search still
  narrows correctly.
- **Technique:** Combinatorial / pairwise testing of filters; checking each row against the criteria.
- **Checklist:** §2 Functional; §3 Test design (combinations).
- **Evidence:** Screenshot showing both filters and the non-matching row highlighted.
- **Verified:** Yes. `BUG-011 …` fails: expected 1 row, received 6.
- **Location:** `server/repositories/product.repository.ts` › `findProducts()` joins the dropdown
  filters with `' OR '`.
- **Fix:** Push both conditions to `conditions` (joined with AND).

### BUG-012: Sorting by Status fails

- **Module / feature:** Product list › sorting (`sort=status`)
- **Severity:** Medium. A visible column header offers a sort that always errors; the user has to
  pick another column to recover.
- **Steps:** Click the **Status** column header.
- **Expected:** Rows sorted Active → Discontinued → Inactive (LIST-6).
- **Actual:** Table shows "We couldn't load products. The product list query is invalid." with **Try
  again** (which fails again). Network: `GET /api/products?sort=status…` → **400**
  (`Sorting by "status" is not supported`). Console: `[products] Failed to load products` plus the
  failed request. Reloading the page keeps failing because the sort is in the URL.
- **Technique:** Explore every control; console and network monitoring.
- **Checklist:** §16 Console & Logs; §9 Status codes; §13 Error handling; §2 Functional.
- **Evidence:** Screenshot of the error plus the 400 response body.
- **Verified:** Yes. `BUG-012 …` fails: error alert present.
- **Location:** `server/repositories/product.repository.ts` › `SORT_COLUMNS` has no `status` entry;
  the UI (`ProductTable.tsx` › `COLUMNS`) offers it.
- **Fix:** Add `status: 'status'` to the whitelist.

### BUG-013: Search sends one request per keystroke

- **Module / feature:** Product list › search performance
- **Severity:** Low. No visible malfunction, but needless load on the API (8 requests for
  "keyboard"), and a risk of out-of-order results on slow networks.
- **Steps:** Open DevTools › Network, filter `products`, type `keyboard` into search.
- **Expected:** One request after typing pauses (~300 ms) (LIST-4).
- **Actual:** 8 requests: `search=k`, `ke`, `key` … `keyboard`. The URL also changes on every key.
- **Technique:** Performance observation with DevTools; non-functional requirement check.
- **Checklist:** §11 Performance; §9 API requests.
- **Evidence:** Screenshot or HAR of the Network tab listing the requests.
- **Verified:** Yes. `BUG-013 …` fails: received 8 requests (k … keyboard), expected ≤ 2.
- **Location:** `src/domains/products/presentation/useProductList.ts`: the search effect updates the
  URL immediately (no debounce timer).
- **Fix:** Restore a ~300 ms `setTimeout`/`clearTimeout` debounce.

### BUG-014: Deleting the last row on the last page leaves an empty page

- **Module / feature:** Product list › pagination after delete
- **Severity:** Medium. The user appears to have deleted everything ("No products yet") until they
  page back; confusing and alarming.
- **Steps:**
  1. Rows per page **5**, go to page **4** (one product: Wireless Ergonomic Mouse).
  2. Delete it and confirm.
- **Expected:** Page 3 of 3 with five products (LIST-8).
- **Actual:** Empty table with "No products yet / Products you add will appear here", footer
  "Showing 16–15 of 15 products" and "Page 4 of 3". The same happens for `?page=99` in the URL.
- **Technique:** Boundary value analysis on pagination; state change after delete.
- **Checklist:** §3 Edge cases; §7 Edit/Delete; §11 Pagination.
- **Evidence:** Screenshot of the empty page with the footer.
- **Verified:** Yes. `BUG-014 …` fails: "Page 3 of 3" never appears.
- **Location:** `src/domains/products/presentation/useProductList.ts`: no step back when a page is
  past the end (`getTotalPages` is exported but unused).
- **Fix:** When `items` is empty, `total > 0` and `page > 1`, move to the last page.

### BUG-015: Row Delete button has no accessible name or tooltip

- **Module / feature:** Product list › row actions (accessibility)
- **Severity:** Medium. Screen-reader users hear only "button"; mouse users get no tooltip for the
  icon (the Edit icon next to it has both).
- **Steps:**
  1. Hover the pencil icon: tooltip "Edit". Hover the bin icon: no tooltip.
  2. Inspect the bin button (DevTools › Accessibility pane) or run Lighthouse/axe: no accessible
     name ("Buttons must have discernible text").
- **Expected:** "Delete <product name>" accessible name and a "Delete" tooltip (NFR-2).
- **Actual:** Empty accessible name, no `title`.
- **Technique:** Accessibility inspection; consistency between sibling controls.
- **Checklist:** §12 Labels, Tooltips, Screen reader; §4 Icons.
- **Evidence:** Screenshot of the accessibility pane or the Lighthouse finding.
- **Verified:** Yes. `BUG-015 …` fails: accessible name is "".
- **Location:** `src/domains/products/presentation/ProductTableRow.tsx`: the delete `<button>` lacks
  `aria-label` and `title`.
- **Fix:** Add `aria-label={`Delete ${product.name}`}` and `title="Delete"`.

### BUG-016: "Discontinued" badge is green

- **Module / feature:** Product list / details › status badge
- **Severity:** Low. Cosmetic, but it signals "good" for products that can no longer be sold.
- **Steps:** Look at Cast Iron Skillet 12" or Trail Running Backpack 20L.
- **Expected:** Discontinued is red; Active green; Inactive grey (LIST-7).
- **Actual:** Discontinued uses the same green as Active.
- **Technique:** Visual inspection against the specification.
- **Checklist:** §4 Colours; §1 requirements.
- **Evidence:** Screenshot showing an Active and a Discontinued row.
- **Verified:** Yes. `BUG-016 …` fails: `data-tone="success"` instead of `danger`.
- **Location:** `src/domains/products/presentation/StatusBadge.tsx` › `STATUS_TONES.discontinued`.
- **Fix:** `'danger'`.

### BUG-017: Product table is cut off on tablet and mobile

- **Module / feature:** Product list › responsive layout
- **Severity:** Medium. On tablets and phones the Price/Stock/Status/Actions columns are clipped
  with no way to scroll, so Edit/Delete can't be reached from the list (workaround: open the product).
- **Steps:** DevTools device mode at 820 px (iPad Air) or 390 px (iPhone 12/13/14), open Products,
  try to scroll the table sideways.
- **Expected:** The table scrolls horizontally (LIST-11).
- **Actual:** Columns beyond the card edge are hidden and cannot be scrolled. The dashboard's
  "Recently added" table scrolls correctly, which makes a good comparison.
- **Technique:** Responsive testing at common breakpoints.
- **Checklist:** §10 Tablet/Mobile; §4 No broken UI.
- **Evidence:** Screenshots at 820 px and 390 px.
- **Verified:** Yes. `BUG-017 …` fails: `overflow-x: hidden`, `scrollWidth` 994 > `clientWidth` 770.
- **Location:** `src/domains/products/presentation/ProductTable.tsx`: wrapper `overflow-hidden`.
- **Fix:** `overflow-x-auto`.

### BUG-018: Price of $0.00 is accepted

- **Module / feature:** Add/Edit product › price validation (shared by form and API)
- **Severity:** Medium. Free products can be published by mistake; the minimum stated in the hint
  and the error text is $0.01.
- **Steps:** Add product with valid values and price `0` (or `0.00`). Save.
- **Expected:** "Price must be between $0.01 and $99,999.99".
- **Actual:** Saved; the list shows $0.00. `-0.01` and `100000` are rejected correctly; `0.01` works.
- **Technique:** Boundary value analysis (min − 0.01, min, min + 0.01).
- **Checklist:** §3 BVT/BVA; §5 Invalid inputs.
- **Evidence:** Screenshot of the saved product with $0.00.
- **Verified:** Yes. `BUG-018 …` fails: no validation message; product created.
- **Location:** `src/domains/products/domain/product.rules.ts` › `validatePrice()` checks `price < 0`.
- **Fix:** `price < PRICE_MIN`.

### BUG-019: Fractional quantity is accepted

- **Module / feature:** Add/Edit product › quantity validation (shared by form and API)
- **Severity:** Medium. Stock of "2.5 units" corrupts stock counts and value.
- **Steps:** Add product with quantity `2.5`. Save.
- **Expected:** "Quantity must be a whole number".
- **Actual:** Saved; the list shows stock `2.5` with a Low stock badge. The hint under the field says
  "Whole number from 0 to 10,000".
- **Technique:** Equivalence partitioning (non-integer numbers: an invalid class).
- **Checklist:** §3 EP; §5 Invalid inputs.
- **Evidence:** Screenshot of the row with 2.5.
- **Verified:** Yes. `BUG-019 …` fails: no validation message.
- **Location:** `src/domains/products/domain/product.rules.ts` › `validateQuantity()` has no
  `Number.isInteger` check.
- **Fix:** Restore the whole-number check.

### BUG-020: A name made only of spaces is accepted

- **Module / feature:** Add/Edit product › name validation
- **Severity:** Medium. Creates a product with a blank name: an invisible, unclickable link in the
  list and an empty heading on its page.
- **Steps:** Add product, Name = 3 or more spaces, other fields valid. Save.
- **Expected:** "Product name is required".
- **Actual:** Saved. The server trims the name, so the product is stored with an empty name; the
  list row shows only the SKU and ID. `"ab"` is correctly rejected as too short.
- **Technique:** Mandatory-field testing with whitespace; EP.
- **Checklist:** §5 Mandatory fields, Leading/trailing spaces; §7 Data saved correctly.
- **Evidence:** Screenshot of the row with no name; detail page heading empty.
- **Verified:** Yes. `BUG-020 …` fails: no validation message.
- **Location:** `src/domains/products/domain/product.rules.ts` › `validateName()` does not trim before
  the required/min-length checks.
- **Fix:** `const name = raw.trim()`.

### BUG-021: Names of 81–100 characters fail with a generic error

- **Module / feature:** Add/Edit product › name length (form vs database)
- **Severity:** Medium. Valid input per the form (counter shows `/100`) cannot be saved, and the
  message gives no clue why.
- **Steps:** Add product with an 85-character name (the counter shows 85/100). Save. Try exactly 80.
- **Expected:** Up to 100 characters save (FORM-2).
- **Actual:** Toast "Couldn't create the product. Something went wrong on our side. Please try again
  later." Network: **500** `INTERNAL_ERROR`. Server terminal: `SqliteError: CHECK constraint failed:
length(name) <= 80`. 80 characters save fine.
- **Technique:** Boundary value analysis at the maximum (and finding the real limit by bisection).
- **Checklist:** §3 BVA; §5 Character limits; §13 User-friendly errors; §9 Status codes; §16 Console.
- **Evidence:** Screenshot of the counter + toast; 500 response; server log line.
- **Verified:** Yes. `BUG-021 …` fails: stays on `/products/new` (500).
- **Location:** `server/db/schema.ts`: `CHECK (length(name) <= 80)` vs `PRODUCT_NAME_MAX_LENGTH = 100`.
- **Fix:** Align the column limit to 100 and map constraint errors to a 400 field error.

### BUG-022: Double-clicking Create product submits twice

- **Module / feature:** Add product › submit button state
- **Severity:** Medium. Contradictory feedback ("created" and "already exists"), and duplicates
  wherever uniqueness isn't enforced.
- **Steps:** Fill a valid new product. **Double-click** Create product.
- **Expected:** One request; button shows "Saving…" and is disabled (FORM-3). Compare Edit, which
  does this correctly.
- **Actual:** Two POSTs: 201 then 409. Both toasts appear: "“…” was created." and "Couldn't create the
  product. A product with SKU … already exists." The button never shows a loading state.
- **Technique:** Error guessing (double submit); observing button states.
- **Checklist:** §4 Button states (loading); §9 Request payloads; §2 Repeated action.
- **Evidence:** Screen recording plus the Network tab with both POSTs.
- **Verified:** Yes. `BUG-022 …` fails: 2 POST requests.
- **Location:** `src/domains/products/presentation/ProductCreatePage.tsx` › `submit()` never calls
  `setSubmitting(true)`.
- **Fix:** Set submitting before the request (as `ProductEditForm` does).

### BUG-023: Price error overlaps the hint text

- **Module / feature:** Add/Edit product › price field layout
- **Severity:** Low. Cosmetic, but the message is hard to read.
- **Steps:** Open Add product, leave Price empty, click Create product (any width; clearest on a phone).
- **Expected:** Message under the field in normal flow, hint hidden (FORM-1), like every other field.
- **Actual:** "Price is required" is drawn on top of the hint "Between $0.01 and $99,999.99"; the
  longer range message also runs into the next field on narrow screens.
- **Technique:** Visual inspection of every error state.
- **Checklist:** §4 No overlapping UI; §10 Mobile.
- **Evidence:** Zoomed screenshot.
- **Verified:** Yes. `BUG-023 …` fails: error box overlaps the hint box.
- **Location:** `src/domains/products/presentation/PriceField.tsx`: error rendered `absolute` while
  the hint stays visible.
- **Fix:** Pass `error` to `FormField` like other fields.

### BUG-024: Special characters are HTML-escaped on save and grow on every edit

- **Module / feature:** Add/Edit product › name storage (`POST`/`PUT /api/products`)
- **Severity:** High. Silent data corruption that gets worse with each save; the corrupted text
  also counts toward the length limit (see BUG-021).
- **Steps:**
  1. Add a product named `Salt & Vinegar <Party> Pack`. The list shows
     `Salt &amp; Vinegar &lt;Party&gt; Pack`.
  2. Or edit the seeded _Salt & Pepper Grinder Set_ (change only the price) and save twice: the name
     becomes `Salt &amp; Pepper …` then `Salt &amp;amp; Pepper …`.
- **Expected:** Saved and shown exactly as typed (FORM-4). React already escapes output safely.
- **Actual:** Entities are stored in the database and shown literally; every save escapes again.
- **Technique:** Special-character EP; regression check of existing data after edit.
- **Checklist:** §5 Special characters; §15 Input sanitization; §7 Data saved correctly; §14
  Regression (editing existing records).
- **Evidence:** Screenshots after each save; `GET /api/products/7` response body.
- **Verified:** Yes. `BUG-024 …` fails: received `Salt &amp; Vinegar &lt;Party&gt; Pack`. Manual
  check: two saves of product 7 produced `Salt &amp;amp; Pepper Grinder Set`.
- **Location:** `server/lib/sanitize.ts` › `sanitizeText()`, called from
  `server/services/product.service.ts` › `toProductValues()`.
- **Fix:** Store raw text (trim only); escape on output, which React already does.

### BUG-025: Changing only the status is not saved, but success is shown

- **Module / feature:** Edit product (`PUT /api/products/:id`)
- **Severity:** High. Silent data loss with a success message: users believe a product was
  deactivated when it is still live.
- **Steps:** Edit Yoga Mat Pro 6mm, change Status to Inactive, Save. Go to Products (or refresh).
- **Expected:** Status Inactive everywhere (FORM-5).
- **Actual:** Toast "“Yoga Mat Pro 6mm” was updated." but the list (and the database) still say
  Active. Other fields in the same save _are_ updated. The PUT response body shows `"status":"active"`.
- **Technique:** Field-by-field CRUD verification; persistence after refresh.
- **Checklist:** §2 Functional; §7 Edit, Data persists after refresh.
- **Evidence:** Edit form screenshot, success toast, list after refresh; PUT request vs response.
- **Verified:** Yes. `BUG-025 …` fails: row still shows "Active".
- **Location:** `server/repositories/product.repository.ts` › `updateProductById()`: `status` is
  missing from the `SET` list.
- **Fix:** Add `status = @status`.

### BUG-026: Edit allows a duplicate SKU that differs only in case

- **Module / feature:** Edit product › SKU uniqueness
- **Severity:** High. Breaks the uniqueness rule that integrations rely on; the duplicate is
  hard to spot (see BUG-009).
- **Steps:**
  1. Add product with SKU `el-1001` → correctly rejected ("This SKU is already used by another
     product").
  2. Edit Yoga Mat Pro 6mm, set SKU to `el-1001`, Save.
- **Expected:** Same rejection on edit; SKU stored in upper case (form rules).
- **Actual:** Saved. The catalogue now has `EL-1001` (#1) and `el-1001` (#12); the lower-case SKU is
  stored as typed.
- **Technique:** EP (case variants); comparing equivalent flows (add vs edit).
- **Checklist:** §5 Invalid inputs; §3 EP; §7 Data saved correctly; §2 Alternate flows.
- **Evidence:** Screenshot of both rows sorted by name; the PUT 200 response.
- **Verified:** Yes. `BUG-026 …` fails: no SKU error; manual check shows SKUs `EL-1001 · #1` and
  `el-1001 · #12`.
- **Location:** `server/services/product.service.ts` › `updateProduct()` skips `normalizeSku()`
  (`createProduct()` calls it), and the unique index is case-sensitive.
- **Fix:** Normalise in both paths (and/or `UNIQUE COLLATE NOCASE`).

### BUG-027: Detail and edit pages show stale data after saving

- **Module / feature:** Product detail / edit › client-side cache
- **Severity:** Medium. Users think their change failed and edit again; Back to the form and
  saving again **reverts** the change.
- **Steps:**
  1. From the list, click Edit on Yoga Mat Pro 6mm, change price to `49.99`, Save.
  2. You land on the product page: it still says **$39.99** (the toast says updated).
  3. Refresh: $49.99. Alternatively press Back after saving: the form shows the old values.
- **Expected:** New values immediately everywhere (FORM-5).
- **Actual:** Detail and edit pages use a per-tab cache that is never refreshed after an update;
  the list (which always fetches) shows the new price. Only a full page refresh clears it.
- **Technique:** Data consistency across views; refresh/Back navigation.
- **Checklist:** §7 Data persists after refresh; §6 Browser Back.
- **Evidence:** Screen recording: save → stale page → refresh → updated.
- **Verified:** Yes. `BUG-027 …` fails: "$49.99" not visible after saving.
- **Location:** `src/domains/products/application/product.service.ts` › `productCache` used by
  `fetchProduct()`; `updateProduct()` doesn't update or clear it.
- **Fix:** Remove the cache, or update it after a successful PUT.

### BUG-028: "Products" breadcrumb on the Edit page opens the Dashboard

- **Module / feature:** Edit product › breadcrumbs
- **Severity:** Low. Navigation annoyance with an easy workaround.
- **Steps:** Open any product's Edit page, click **Products** in the breadcrumb.
- **Expected:** Product list (NAV-2). The same breadcrumb on Add and Details pages works.
- **Actual:** Dashboard (the link goes to `/`, which redirects to `/dashboard`).
- **Technique:** Click every link; consistency across pages.
- **Checklist:** §6 Breadcrumbs, Links.
- **Evidence:** Hover status bar showing `/`; resulting page.
- **Verified:** Yes. `BUG-028 …` fails: URL `/dashboard`.
- **Location:** `src/domains/products/presentation/ProductEditForm.tsx` › breadcrumbs `to: '/'`.
- **Fix:** `to: '/products'`.

### BUG-029: Cancel one delete, confirm another, and the wrong product is deleted

- **Module / feature:** Product list › delete confirmation
- **Severity:** Critical. Deletes a record the user never confirmed, while the message names the
  one they did. Irreversible data loss.
- **Preconditions:** Product list freshly loaded (no delete dialog opened yet on this visit).
- **Steps:**
  1. Click the bin for **Yoga Mat Pro 6mm**, then **Cancel**.
  2. Click the bin for **Waterproof Rain Jacket**; the dialog names the Rain Jacket. Confirm.
- **Expected:** Rain Jacket deleted (DEL-1).
- **Actual:** Toast "“Waterproof Rain Jacket” was deleted." but **Yoga Mat Pro 6mm** disappears and the
  Rain Jacket is still there. Network: `DELETE /api/products/12` (the Yoga Mat's id). Deleting
  without cancelling first, and deleting from the detail page, work correctly.
- **Technique:** Alternate flows (cancel then act); verifying the _outcome_ not the message.
- **Checklist:** §2 Alternate flows; §7 Edit/Delete functionality.
- **Evidence:** Screen recording plus the DELETE request URL.
- **Verified:** Yes. `BUG-029 …` fails: AP-5002 still present (and SP-4001 gone).
- **Location:** `src/domains/products/presentation/useProductDelete.ts` › `pendingId` ref is set with
  `??=` and not cleared on Cancel.
- **Fix:** Clear `pendingId` on cancel, or drop the ref and use `target.id`.

### BUG-030: Delete dialog overflows with a long product name on phones

- **Module / feature:** Delete confirmation dialog › responsive layout
- **Severity:** Low. Text runs off the dialog and screen; the product name is cut off.
- **Steps:** Width 390 px, open _Ergonomic Mesh Office Chair with Adjustable Lumbar Support_ (or any
  long name), tap **Delete**.
- **Expected:** Name wraps inside the dialog (NFR-1).
- **Actual:** Name stays on one line and extends past the dialog's right edge (to x≈448 px on a
  374 px-wide dialog).
- **Technique:** Responsive testing with long data (combining BVA on length with viewport).
- **Checklist:** §10 Mobile; §4 Overlapping/broken UI.
- **Evidence:** Phone-width screenshot.
- **Verified:** Yes. `BUG-030 …` fails: name right edge 448 > dialog edge 374.
- **Location:** `src/domains/products/presentation/DeleteProductDialog.tsx`: name span uses
  `whitespace-nowrap`.
- **Fix:** `break-words`.

### BUG-031: An unknown product id spins forever

- **Module / feature:** Product detail / edit › not-found handling
- **Severity:** Medium. Stale bookmarks or deleted products leave users on an endless "Loading
  product" spinner with no way forward except the sidebar.
- **Steps:** Open `/products/9999` or `/products/abc` (also `/products/9999/edit`).
- **Expected:** "Product not found" with a link back (DET-3).
- **Actual:** Endless spinner. Network shows 404 (or 400 for `abc`), so the API is right and the UI
  ignores it.
- **Technique:** URL manipulation; error guessing.
- **Checklist:** §13 Error handling; §15 URL manipulation; §4 Loading states.
- **Evidence:** Screenshot after waiting + the 404 response.
- **Verified:** Yes. `BUG-031 …` fails: heading never appears; manual check shows only "Loading
  product" after 3 s.
- **Location:** `src/domains/products/presentation/useProduct.ts`: only `status >= 500` and network
  errors leave the loading state.
- **Fix:** Map 404/400 to the existing `not-found` state.

### BUG-032: Viewers see Edit and Delete on the product detail page

- **Module / feature:** Roles › product detail page
- **Severity:** Medium. Misleading UI for read-only users. The server correctly refuses, so no data
  changes, but users hit errors.
- **Preconditions:** Signed in as `viewer@buggystore.test`.
- **Steps:**
  1. Products list: no Add, Edit or Delete (correct).
  2. Open any product: **Edit** and **Delete** buttons are shown.
  3. Delete → confirm: toast "You don't have permission to perform this action." (403).
  4. Edit → redirected to Products with "You don't have permission to add or edit products."
- **Expected:** No change controls for viewers anywhere (ROLE-1).
- **Actual:** As above.
- **Technique:** Role-based testing: repeat each screen as every role.
- **Checklist:** §8 Role-based access.
- **Evidence:** Viewer screenshot of the detail page, plus the 403 response.
- **Verified:** Yes. `BUG-032 …` fails: Edit link count 1 (expected 0).
- **Location:** `src/domains/products/presentation/ProductDetailPage.tsx` has no `canManage` prop;
  `src/App.tsx` routes the page without a permission check.
- **Fix:** Pass `canManage` as the list page does.

### BUG-033: Logout cannot be reached or used with the keyboard

- **Module / feature:** Sidebar › Logout (accessibility)
- **Severity:** Medium. Keyboard-only users can't sign out (important on shared computers).
- **Steps:** Click into the page, press **Tab** repeatedly through the sidebar.
- **Expected:** Focus moves Dashboard → Products → **Logout**, and Enter signs out (NFR-2).
- **Actual:** Focus skips Logout. It is a `div role="button"` with a click handler only, so it is
  announced as a button but cannot be focused or activated by keyboard. It also lacks a focus style.
- **Technique:** Keyboard-only navigation; focus order.
- **Checklist:** §12 Keyboard navigation, Focus order.
- **Evidence:** Screen recording of tabbing; Elements panel showing the `div`.
- **Verified:** Yes. `BUG-033 …` fails: focus after the Products link is not on Logout.
- **Location:** `src/shared/layout/SidebarContent.tsx`: Logout `<div role="button">`.
- **Fix:** Use a `<button type="button">`.

---

## Traceability matrix: defects × `manual_test.md` sections

✓ = the defect is a realistic find for that checklist section.

| ID      | 1 Req | 2 Func | 3 Design | 4 UI  | 5 Input | 6 Nav | 7 Data | 8 Roles | 9 API | 10 Resp | 11 Perf | 12 A11y | 13 Error | 14 Regr | 15 Sec | 16 Console |
| ------- | :---: | :----: | :------: | :---: | :-----: | :---: | :----: | :-----: | :---: | :-----: | :-----: | :-----: | :------: | :-----: | :----: | :--------: |
| BUG-001 |       |        |    ✓     |       |    ✓    |       |        |         |       |         |         |         |          |         |        |            |
| BUG-002 |   ✓   |        |          |       |         |   ✓   |        |         |       |         |         |         |          |         |   ✓    |            |
| BUG-003 |       |        |          |       |         |   ✓   |        |         |   ✓   |         |         |         |          |         |   ✓    |            |
| BUG-004 |   ✓   |   ✓    |          |       |         |       |        |         |       |         |         |         |    ✓     |         |   ✓    |            |
| BUG-005 |       |        |    ✓     |       |    ✓    |       |        |         |       |         |         |         |          |         |        |            |
| BUG-006 |   ✓   |        |    ✓     |       |         |       |   ✓    |         |       |         |         |         |          |         |        |            |
| BUG-007 |   ✓   |   ✓    |          |       |         |       |   ✓    |         |       |         |         |         |          |         |        |            |
| BUG-008 |       |        |          |       |         |       |   ✓    |         |   ✓   |         |         |         |    ✓     |         |        |     ✓      |
| BUG-009 |       |   ✓    |    ✓     |       |         |       |        |         |       |         |         |         |          |         |        |            |
| BUG-010 |       |   ✓    |    ✓     |       |         |       |   ✓    |         |       |         |         |         |          |         |        |            |
| BUG-011 |       |   ✓    |    ✓     |       |         |       |        |         |       |         |         |         |          |         |        |            |
| BUG-012 |       |   ✓    |          |       |         |       |        |         |   ✓   |         |         |         |    ✓     |         |        |     ✓      |
| BUG-013 |       |        |          |       |         |       |        |         |   ✓   |         |    ✓    |         |          |         |        |            |
| BUG-014 |       |        |    ✓     |       |         |       |   ✓    |         |       |         |    ✓    |         |          |         |        |            |
| BUG-015 |       |        |          |   ✓   |         |       |        |         |       |         |         |    ✓    |          |         |        |            |
| BUG-016 |   ✓   |        |          |   ✓   |         |       |        |         |       |         |         |         |          |         |        |            |
| BUG-017 |       |        |          |   ✓   |         |       |        |         |       |    ✓    |         |         |          |         |        |            |
| BUG-018 |       |        |    ✓     |       |    ✓    |       |        |         |       |         |         |         |          |         |        |            |
| BUG-019 |       |        |    ✓     |       |    ✓    |       |        |         |       |         |         |         |          |         |        |            |
| BUG-020 |       |        |          |       |    ✓    |       |   ✓    |         |       |         |         |         |          |         |        |            |
| BUG-021 |       |        |    ✓     |       |    ✓    |       |        |         |   ✓   |         |         |         |    ✓     |         |        |     ✓      |
| BUG-022 |       |   ✓    |          |   ✓   |         |       |        |         |   ✓   |         |         |         |          |         |        |            |
| BUG-023 |       |        |          |   ✓   |         |       |        |         |       |    ✓    |         |         |          |         |        |            |
| BUG-024 |       |        |          |       |    ✓    |       |   ✓    |         |       |         |         |         |          |    ✓    |   ✓    |            |
| BUG-025 |       |   ✓    |          |       |         |       |   ✓    |         |       |         |         |         |          |         |        |            |
| BUG-026 |       |   ✓    |    ✓     |       |    ✓    |       |   ✓    |         |       |         |         |         |          |         |        |            |
| BUG-027 |       |        |          |       |         |   ✓   |   ✓    |         |       |         |         |         |          |         |        |            |
| BUG-028 |       |        |          |       |         |   ✓   |        |         |       |         |         |         |          |         |        |            |
| BUG-029 |       |   ✓    |          |       |         |       |   ✓    |         |       |         |         |         |          |         |        |            |
| BUG-030 |       |        |          |   ✓   |         |       |        |         |       |    ✓    |         |         |          |         |        |            |
| BUG-031 |       |        |          |   ✓   |         |       |        |         |       |         |         |         |    ✓     |         |   ✓    |            |
| BUG-032 |       |        |          |       |         |       |        |    ✓    |       |         |         |         |          |         |        |            |
| BUG-033 |       |        |          |       |         |       |        |         |       |         |         |    ✓    |          |         |        |            |
| **Σ**   | **5** | **10** |  **11**  | **7** |  **8**  | **4** | **11** |  **1**  | **6** |  **3**  |  **2**  |  **2**  |  **5**   |  **1**  | **5**  |   **3**    |

## Coverage against the 18-point testing model

| #   | Coverage area (from the brief)                                     | Defects                                                       | Coverage                                                                      |
| --- | ------------------------------------------------------------------ | ------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| 1   | Requirement understanding and acceptance criteria                  | All (oracle: `requirements.md`); esp. 002, 004, 006, 007, 016 | Covered                                                                       |
| 2   | Happy paths, negative scenarios, alternate flows                   | 004, 022, 025, 026, 029                                       | Covered                                                                       |
| 3   | Boundary Value Testing / Analysis                                  | 006, 014, 018, 021, 030                                       | Covered                                                                       |
| 4   | Equivalence Partitioning                                           | 001, 005, 009, 019, 026                                       | Covered                                                                       |
| 5   | UI layout and visual behaviour                                     | 016, 017, 023, 030                                            | Covered                                                                       |
| 6   | Button states and loading behaviour                                | 022, 031                                                      | Covered                                                                       |
| 7   | Mandatory fields, invalid input, special chars, spaces, copy/paste | 001, 005, 019, 020, 024                                       | Covered                                                                       |
| 8   | Navigation, redirects, Back and Forward                            | 002, 003, 027, 028                                            | Covered                                                                       |
| 9   | Data persistence and CRUD verification                             | 007, 020, 024, 025, 026, 027, 029                             | Covered                                                                       |
| 10  | Permissions and roles                                              | 032                                                           | Covered (two roles only)                                                      |
| 11  | API payloads, responses, status codes, errors                      | 003, 012, 013, 021, 022                                       | Covered                                                                       |
| 12  | Responsive and cross-browser                                       | 017, 023, 030                                                 | **Partial**: responsive yes; no browser-specific defect                       |
| 13  | Performance and large data handling                                | 013                                                           | **Partial**: request efficiency only; the 316-product dataset works correctly |
| 14  | Accessibility and keyboard navigation                              | 015, 033                                                      | Covered (labels, tooltips, keyboard, focus)                                   |
| 15  | Network and server error handling                                  | 008, 012, 021, 031                                            | Covered (no timeout scenario)                                                 |
| 16  | Regression testing                                                 | 024 (editing existing data)                                   | **Partial**: see limitations                                                  |
| 17  | Safe security testing, URL manipulation, restricted routes         | 002, 003, 004, 024, 031, 032                                  | Covered (local, controlled examples only)                                     |
| 18  | Console errors and unexpected API failures                         | 008, 012, 021                                                 | Covered                                                                       |

## Limitations: what the app does not realistically cover

- **Cross-browser (§10):** all defects reproduce in every modern browser; there is no
  browser-specific defect. Participants can still practise running the same checks in two browsers.
- **Large data / UI freezing (§11):** `npm run db:reset:large` loads 316 products, and pagination
  and search keep working. There is no slow-rendering or memory defect. Infinite scroll does not
  exist.
- **Timeout scenarios (§13):** the API answers in about 300 ms, and there is no long-running
  operation or client timeout to exceed. Throttling and offline mode in DevTools are the realistic
  substitutes.
- **Regression (§14):** no defect is a regression of a previously working version for participants
  to compare with. BUG-024 (editing existing data corrupts it) is the closest. For a regression demo,
  run the automated suite (`npm run test:e2e`) and discuss the 42 baseline checks.
- **File upload validation (§15):** the app has no uploads.
- **Screen reader support (§12):** BUG-015 and BUG-033 can be found with the accessibility tree or
  Lighthouse; a full screen-reader audit was not designed in.
- **Roles (§8):** only two roles (administrator, viewer); no row-level or field-level permissions.
- **Email:** password reset is mocked (the server logs `[mock-mail] …`); there is no reset-password
  page or email content to test.

## Interactions between defects

Reset (`npm run db:reset`) and reload the page between reproductions to avoid these.

- **BUG-029 and BUG-014:** if a delete dialog was cancelled earlier on the list page, the next
  confirmed delete removes the wrong product. Reload the list before reproducing BUG-014.
- **BUG-027 and BUG-025:** after editing the status, the detail page shows the old status because of
  the cache _and_ because it wasn't saved. Check the list or refresh to separate the two.
- **BUG-024 and BUG-021:** each `&` grows to `&amp;` (+4 characters) on every save, so names near 80
  characters with special characters eventually fail with the generic error.
- **BUG-026 and BUG-009:** after creating `el-1001`, searching `EL-1001` shows only the upper-case
  product, which hides the duplicate; sort by name with 25 rows to see both.
- **BUG-010 and BUG-006:** sorting by Stock to count low-stock items gives a misleading order; count
  badges instead.
- **BUG-018, BUG-019, BUG-020** use the shared validator, so they also apply on the Edit form and
  through the API.
- **BUG-001** only affects the sign-in form (the forgot-password form trims spaces).
- **BUG-022** relies on the default ~300 ms API latency; keep `API_LATENCY_MS` at its default.
- **BUG-017, BUG-023 and BUG-030** depend on viewport width (tablet/phone).

## Expected behaviour that is not a defect

Use these to triage participant reports.

- Network errors for 4xx responses in the console (wrong password 401, duplicate SKU 409): this is
  browser behaviour, and the app handles these responses correctly.
- About 300 ms delay on every API call (deliberate, so loading states can be seen).
- No email is sent; there is no reset-password page.
- Product IDs are never reused after a delete (`AUTOINCREMENT`).
- Times are shown in the browser's time zone; currency is always USD, formatted en-US.
- Changing sort, filters or page size returns to page 1.
- Viewers can open product details (read-only access is intended; only the buttons are wrong).
- A reset (`npm run db:reset`) signs everyone out.
- Opening `/login` while signed in goes to the dashboard (AUTH-7).

### Things that work correctly (positive controls)

Sign-in validation and error messages, password show/hide, case-insensitive email, session restore on
refresh, session expiry message, route protection for every page, viewer restrictions on the list and
on `/products/new` and `/products/:id/edit`, forgot-password required/format validation, dashboard
Total and Active counts and recently added list, sidebar active state, 404 page, product list paging
and page sizes, name search (case- and space-insensitive, `%` treated literally), single filters,
sorting by name/category/created, URL-synced filters with Back/Forward, empty states, list error
state (try DevTools Offline on Products), add-product validation (required, min length, SKU format,
price decimals and maximum, quantity range, maximum name length in the input), duplicate SKU on Add
(any case), edit of name/price/quantity/category, delete with confirm/Cancel/Escape, dialog focus
management, server-side validation, 401/403/404/409 status codes, persistence across restarts.

## Verification record

Run on 2026-10-21, Node 20.19.0, Chromium 153 (Playwright 1.63.0), `npm run test:e2e`.

| Build                                     | Baseline suite (42) | Defect suite (33)                      |
| ----------------------------------------- | ------------------- | -------------------------------------- |
| Before seeding (`BUGGY_STORE_BASELINE=1`) | 42 passed           | 33 passed (assertions proven correct)  |
| Seeded demo build                         | 42 passed           | 33 failed as expected (all reproduced) |

The observed values quoted under each defect come from the seeded run's failure messages
(`test-results/results.json`) and a manual Playwright walkthrough. Screenshots of every defect test
are saved under `test-results/` when the defect suite runs (`screenshot: 'on'`), and
`npm run test:e2e:report` opens the HTML report.
