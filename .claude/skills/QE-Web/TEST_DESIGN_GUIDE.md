> **Note:** No longer an independently-triggered Claude Code skill. It's read and executed by `/web-qa-agent` when the user picks **manual-testing** from its menu — the full procedure below still applies exactly as written.

# Test Design Guide — Requirement Analysis, Coverage Dimensions, Scenario Framework

Loaded once by the manual-testing skill at Phase 1 (Requirement Analysis). Reference sections
by number afterward (e.g. "per §2 trigger table") — never re-quote this file in chat or in
saved reports.

Purpose: manual testing should verify a feature is functionally correct, usable, reliable,
secure, compatible, and aligned with business expectations — not just that the happy path
works. This guide operationalizes that without inflating every card into the same fixed
checklist: coverage is scoped by what the card actually touches (§2) and by risk (§4), so a
copy-change card and a payment card get proportionally different depth.

---

## §1 — Requirement Gap Checklist

Run once per card, right after Phase 1 fetch, before the test plan is drafted. For each row
whose signal is present, fold the question into the **one** consolidated gap-question message
(same message as any Phase 0 gaps — never a second round of questions). Skip a row entirely
if the AC already answers it — do not manufacture questions on a precise, complete AC.

| Gap type | Signal to look for | Question to ask if missing |
|---|---|---|
| No AC at all | Card has no AC/COS section | "No Acceptance Criteria found — what should be tested?" (most severe — if this fires, skip the rest of this table and just ask this) |
| Ambiguous requirement | Vague terms in AC ("appropriate", "as needed", "similar to", "etc.") | Quote the exact phrase, ask for the precise rule |
| Missing validation rule | A field/form is named with no stated format or limit | "What's the valid format/limit for {field}?" |
| Missing negative/error case | AC describes only the happy path, no failure behavior | "What should happen on {plausible failure mode}?" |
| Missing permission rule | Roles/access mentioned but AC doesn't say who can do what | "Which roles can perform this action?" |
| Missing boundary condition | A numeric/length limit is implied ("a short code", "a few items") but not exact | "What's the exact min/max for {field}?" |
| Missing state/workflow rule | A status/workflow field exists but transitions aren't listed | "What are the valid status transitions?" |
| Missing data relationship | AC needs a specific paired entity (parent+child, account+card) without naming which | Already covered by the skill's Test Data & Entity Selection Rules — ask once or mark `🔒 BLOCKED`, don't duplicate the question here |

---

## §2 — Feature Signal → Coverage Dimension Trigger Table

Scan the card title + AC (already read in Phase 1 — no extra fetching, no grepping `src/`)
for these signals. A matched signal turns its dimension(s) ON for test-plan generation in
Phase 3a. Untriggered dimensions are not drafted — this is what keeps test count proportional
to the card instead of forcing all 19 dimensions onto every run.

| Signal in title/AC | Dimensions turned ON |
|---|---|
| login, auth, OTP, session, token, password, logout | Authentication, Security-oriented, State/Workflow (session) |
| role, permission, admin, restricted, access level | Authorization / Permissions |
| payment, price, amount, invoice, refund, subscription, billing, calculation | Boundary/Equivalence, Business Rules, Database, Security-oriented |
| delete, remove, deactivate, cancel, archive | Negative, State/Workflow, Database (soft vs hard delete) |
| upload, download, attachment, file, import, export | File Upload/Download |
| search, filter, sort, paginate, list, table, grid | Search/Filter/Sort/Pagination |
| API, endpoint, integration, webhook, third-party, external service, sync | API, Integration |
| status, state, workflow, transition, approve, submit, draft, review | State/Workflow |
| any form or input field named in the AC | Validation, Boundary/Equivalence |
| notification, email, SMS, push, alert, toast, reminder | Notifications |
| multi-step flow, wizard, redirect, navigation between screens | End-to-End |
| *(always on, every card)* | Functional Positive, Functional Negative, UI/UX States |

No specific signal matched → draft Functional (positive + one negative) + UI/UX States + one
Boundary check only. Do not force File Upload tests on a card with no file field, API tests on
a pure front-end copy change, etc.

---

## §3 — Coverage Dimension Catalog

What each dimension actually means when drafting a test idea:

- **Functional Positive** — valid input/action produces the documented expected result.
- **Functional Negative** — invalid input, missing mandatory field, unauthorized action, wrong
  state transition, or a dependency failure (API/network) is handled without a crash and with
  a correct, user-facing message.
- **Boundary/Equivalence** — see §6 templates. Values at/around a stated limit, and one
  representative value per valid/invalid partition — not exhaustive enumeration.
- **UI/UX States** — see §8. Initial, loading, empty, success, error, disabled states of the
  components the card actually touches.
- **Validation** — mandatory/optional fields, character/numeric limits, special characters,
  whitespace, duplicate values, invalid format, field interdependencies.
- **Business Rules** — role-based/status-based/date-based behavior, calculations, eligibility
  and workflow-transition rules stated in the AC.
- **Authentication** — valid/invalid credentials, empty credentials, OTP flow, session
  expiry, logout, token expiration.
- **Authorization / Permissions** — each distinct role named in the AC gets one test for
  allowed and one for denied behavior; direct-URL/API access with an unauthorized session
  should not succeed just because the UI hid the button.
- **API** (only when the card's flow visibly depends on a request) — correct status code for
  the scenario (200/201/204 success; 400 invalid; 401 unauthenticated; 403 unauthorized; 404
  not found; 409 conflict/duplicate; 500 server failure), response shape sanity, not full
  contract testing.
- **Database** (only when the UI exposes persisted state) — does the value shown after a
  reload match what was submitted; does a delete actually remove/soft-remove the record;
  spot-check only, not a DB audit.
- **Integration** — cross-system handoff visible from the UI (payment gateway redirect,
  auth-provider callback, file-storage upload) — verify the round trip completes and failures
  are surfaced, not the integration's internals.
- **End-to-End** — the full journey named in the card (e.g. Login → create entity → submit →
  see it reflected downstream), not just the single screen in the AC.
- **File Upload/Download** — supported/unsupported type, size limit, empty/corrupted file,
  duplicate filename, correct downloaded filename/contents.
- **Search/Filter/Sort/Pagination** — exact match, no-match, empty query, filter
  combination, clear filters, sort direction, first/last page, empty result page.
- **Notifications** — correct message, correct recipient/trigger, not duplicated, and (if
  observable within the run) sent after both success and retry-after-failure.
- **State/Workflow** — every transition named in the AC, one attempt at an invalid transition,
  and what the UI shows on reopening/refreshing after a transition.
- **Security-oriented** (only for high-risk signals in §4) — direct URL access while logged
  out or as the wrong role, sensitive data not exposed in the URL or in error text, password
  masked, session actually ends on logout.
- **Accessibility spot-check** — one keyboard-only pass through the card's critical path
  (tab order reaches every control, focus is visible, no dead-end). This is a lightweight
  spot-check, not the full WCAG audit — hand off to the `accessibility-testing` skill if the
  card needs that level of coverage.
- **Compatibility** — only when the card explicitly calls out a browser/viewport; otherwise
  out of scope for a single-card manual run (covered separately, not by default here).

---

## §4 — Risk-Based Depth

| Risk tier | Signals (from §2, or explicit in AC) | Depth |
|---|---|---|
| **High** | payment, auth/authz, delete, financial calculation, subscription/billing, critical third-party integration, sensitive data | Each triggered dimension gets 2–3 tests; also add Security-oriented and Database checks even if not explicitly triggered by §2 |
| **Medium** | ordinary business feature, none of the High signals | Each triggered dimension gets 1–2 tests |
| **Low** | copy/label/minor UI-only change | Functional (positive + one negative) plus one regression spot-check — nothing else |

This tier decides **how many tests to draft per dimension**. It's separate from the
`risk-score` toolkit call, which orders the **execution sequence** of whatever was drafted, by
git churn + known-bug density. Run both — they answer different questions.

---

## §5 — Test Scenario Identification Framework

While turning triggered dimensions into numbered T-01, T-02... ideas, walk these 10 questions
once — they map straight onto §3's dimensions and stop scenario drafting from stalling out at
"just the AC's happy path":

1. What can the user do? → Functional Positive
2. What can the user enter? → Validation, Boundary/Equivalence
3. What can go wrong? → Functional Negative
4. What are the limits? → Boundary
5. Who can perform the action? → Authorization/Permissions
6. What happens to the data? → Database/API
7. What happens after the action? → End-to-End, Notifications
8. What happens when the system fails? → Functional Negative (dependency failure)
9. What existing functionality could break? → flag for qa-agent's post-phase regression
   suggestion (Covered Flows overlap) — don't draft duplicate regression tests here
10. What unusual behavior could a real user perform? → at most one exploratory idea, tagged
    clearly (`[exploratory]`) so it doesn't inflate the planned-test count

---

## §6 — Boundary & Equivalence Quick Templates

If the AC (or the answer to a §1 gap question) states a numeric/length range `[MIN, MAX]`:

- Full set (High-risk fields — payments, quotas, security limits): `MIN-1` (invalid), `MIN`
  (valid), `MIN+1` (valid), `MAX-1` (valid), `MAX` (valid), `MAX+1` (invalid) — 6 tests.
- Collapsed set (Medium/Low-risk, wide range): `MIN` (valid), one mid-range value (valid),
  `MAX` (valid), one just-out-of-range value (invalid) — 4 tests.

Equivalence partitioning (no exact boundary stated, just a described valid category): one
representative value below the valid range, one within it, one above it — 3 tests, not an
enumeration of every possible value.

---

## §7 — Defect Record Fields (Phase 4 payload)

Every bug filed from this skill should carry: Title, Environment, Preconditions, Steps to
Reproduce, Expected Result, Actual Result, Severity, Priority, Screenshot, Test data used, and
Build/version (the card ID + run date stands in when the product has no separate build
number). Severity/Priority derivation stays as defined in the skill's Phase 4 table — this
section only adds the two fields (Preconditions, Test data used) that weren't previously
captured.

---

## §8 — State Validation Checklist

For each key screen/component the card's test plan actually reaches, note which of these
states were observed and their result — skip states that are genuinely unreachable within the
test rather than forcing them:

Initial · Loading · Empty · Success · Error · Disabled

---

## §9 — Exit Criteria Quick Check

Before handing off to Phase 5 (test charter), confirm:

- Every planned test executed — `🔒 BLOCKED` is an acceptable outcome, a silently skipped test
  is not.
- No open Critical/Blocker-severity bug among those just filed goes unmentioned — flag it
  prominently in the final summary. This pack does not gate the pipeline on it (no release
  authority here), it only makes sure the flag isn't buried.
- If the product context's `Known Bugs` table (already loaded in Phase 1) lists a bug on this
  same flow with a status other than Closed/Done, one retest of that specific bug was included
  in the plan.
- The regression suggestion in qa-agent Step 5 runs after this skill returns — nothing to do
  here, just don't skip past it.
