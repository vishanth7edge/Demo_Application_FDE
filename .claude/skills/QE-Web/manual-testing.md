---
name: manual-testing
description: >
  Manual Testing branch orchestrator. Follows the flowchart:
  Jira Card Input → Requirement Gap Analysis → UI Testing (Figma MCP, optional) →
  Manual Testing (Playwright MCP) → Bug Reporting (Atlassian MCP) → Test Charter →
  Automation Agent (optional handoff).
  Test planning is risk-scoped and coverage-dimension-driven (see TEST_DESIGN_GUIDE.md) —
  not just "1-3 tests per AC line" — so a payment/auth card gets materially deeper coverage
  than a copy-change card.
  Captures element selectors and interaction data during execution and saves them to an
  automation-hints file for the automation skill to reuse — skipping DOM re-discovery.
  Uses Playwright CLI for zero-token screenshots. Token tracking enabled.
  Can also be run standalone without the qa-agent.
  Triggers when user says: "test [JIRA-KEY]", "run manual testing for [JIRA-KEY]",
  "do QA on [JIRA-KEY]", "manual test", or "manual-testing".
user-invocable: true
---

> **Note:** No longer an independently-triggered Claude Code skill. It's read and executed by `/web-qa-agent` when the user picks **manual-testing** from its menu — the full procedure below still applies exactly as written.

# Manual Testing Skill — Full Branch Orchestrator

## Token Budget Rules — Zero Tolerance After Login

| Operation | Allowed | Forbidden | Token cost of violation |
|-----------|---------|-----------|------------------------|
| Login page selectors | ONE `browser_snapshot()` at login URL only | `browser_snapshot()` on any other page | ~10k per call |
| All other DOM reading | `browser_evaluate` with targeted CSS/JS selector | `browser_snapshot()` anywhere else | ~10k wasted |
| All screenshots | `npx playwright screenshot --storage-state .playwright-session.json --full-page URL file.png` | `browser_screenshot()` | ~3k per image |
| Session reuse | Check `.playwright-session.json` before login — skip login if file exists and is valid | Re-logging in when session file exists | full login round-trip wasted |

**After the ONE allowed login snapshot — never call `browser_snapshot()` again in this run.**
Use `browser_evaluate` with a specific CSS selector or JS expression for all DOM inspection.

## Test Data & Entity Selection Rules

| Situation | Forbidden | Do instead |
|-----------|-----------|------------|
| A test step needs a value you don't have — a user record, a transaction PIN, a one-time user code | Calling a user-list endpoint or any other app API to fetch/guess it | Ask the user once, in the normal gap-question flow ("This test needs a valid user code — please provide one, or a test user's ID"), or pull it from `.env` / product context if already recorded there |
| A test requires two specifically related entities (e.g. a parent user + a specific child user, an account + a specific linked card) and the AC/COS doesn't name the exact pair | Picking one at random and proceeding as if it passed | Ask the user to specify the pair once. If they can't provide it inline, mark that test `🔒 BLOCKED` with the note "entity relationship not specified — needs manual verification" and continue with the rest of the plan — don't stop the whole run over one test |
| The AC/COS doesn't say how to reach the feature under test (menu path, URL, entry point) | Reading or grepping the `src/` tree to reverse-engineer the route | Ask once: "AC doesn't say how to reach {feature} — what's the navigation path (menu/page) to get there?" |

## Token Tracking

Optional and silent — follow the **Token Tracking** pattern in `SKILLS_CONTEXT.md`
(run its enablement check once at skill start; if disabled, skip every checkpoint silently).
Checkpoints: `start` → `jira_fetch` → `ui_testing` → `test_execution` → `end + report + session`.
Replace `CARD_ID` with the actual card ID. Never show tracking output to user.

---

## Pipeline

```
Jira Card ID
      ↓
[Phase 1] Fetch Jira Card
      ↓
[Phase 2] UI Testing (Figma) — optional, ask user
      ↓
[Phase 3] Manual Test Execution + Automation Hint Capture
      ↓
[Phase 4] Bug Reporting (Atlassian MCP)
      ↓
[Phase 5] Test Charter (publish)
      ↓
[Phase 6] Offer Automation Agent handoff
```

---

## Phase 0 — Inputs

Run token tracking `start` checkpoint (if enabled).

**Invoked by qa-agent (parameter block present):** take `CARD_ID`, `APP_URL`, `LOGIN_URL`,
`FIGMA_URL`, `AUTO_APPROVE`, `CONTEXT_FILE` from the block. Read `.env` for `QA_USERNAME`,
`QA_PASSWORD`, `QA_OTP_CODE`. **Ask no setup questions — qa-agent already collected everything.**
(`FIGMA_URL: none` means `RUN_UI_TEST = false`.)

**Standalone run:** resolve values in precedence order `.env` > product context > ask:
1. Read `.env` → `QA_APP_URL`, `QA_LOGIN_URL`, `QA_USERNAME`, `QA_PASSWORD`, `QA_OTP_CODE`
2. If the user gave no card ID, ask for it. Then derive the project key prefix
   (`QE-89` → `QE`) and read `.claude/skills/QE-Web-QA-Agent/product_context/{PREFIX}/context.md`
   if it exists → fills any URL/OTP gaps (never credentials — those are `.env`-only)
3. Ask ONE consolidated message for whatever is still missing (app URL, credentials,
   Figma link or "skip UI comparison"). Never ask one-at-a-time; never ask for a value
   you already have.

**Never print `QA_PASSWORD` to chat, reports, or hints files.**

---

## Phase 1 — Fetch Jira Card

Use `getJiraIssue` to fetch `CARD_ID`. Extract and store:
- `CARD_TITLE` — summary
- `CARD_DESCRIPTION` — full description
- `ACCEPTANCE_CRITERIA` — look for "AC:", "Given/When/Then", numbered/checklist items
- `FIGMA_URL_FROM_CARD` — any Figma link found in description or comments
- `PROJECT_KEY` — for bug filing later

Derive `PRODUCT_FOLDER` now (uppercase `PROJECT_KEY`'s product name, spaces → `_` — same
normalisation qa-agent Step 6a uses) so Phases 3 and 4 below can call the toolkit without
re-deriving it. If the qa-agent parameter block already named a product folder, use that instead.

If a product folder was resolved, pull known bugs cheaply for the retest check used in 3a/§9
— one script call, not a `context.md` read:
```bash
node .claude/skills/QE-Web-QA-Agent/toolkit/qa-toolkit.cjs get-bugs --product {PRODUCT_FOLDER}
```
Store non-`Closed`/`Done` rows as `OPEN_KNOWN_BUGS`. `NO_CONTEXT_FILE`/`NO_BUGS` → `OPEN_KNOWN_BUGS = []`, first run for this product.

Run token tracking `jira_fetch` checkpoint.

### 1b — Truncate Jira data if card is verbose

After fetching, check `CARD_DESCRIPTION` length:
- If it exceeds 800 words AND contains sections beyond acceptance criteria (e.g. technical notes, design references, comment threads, embedded images):
  - Keep: Title, all Acceptance Criteria / Given-When-Then blocks, any Figma links
  - Discard: Lengthy prose, embedded image references, comment threads, implementation notes
  - Note internally: "Jira description truncated — AC only retained"
- If it is under 800 words or contains only AC — keep in full

Do NOT tell the user the description was truncated. This prevents verbose cards from consuming 5k+ tokens before testing even starts.

Set from Phase 0 values (all input was collected there — do not re-ask):
- `RUN_UI_TEST` — true when a Figma URL is available (from parameter block, card, or user)
- `FIGMA_URL`, `APP_URL`, `USERNAME`, `PASSWORD`, `OTP_CODE`

### 1c — Load Test Design Guide (once)

Read `.claude/skills/QE-Web/TEST_DESIGN_GUIDE.md` now. Per the Static File Load
Rules in `SKILLS_CONTEXT.md`, load it once here and never reload it later in this run —
reference its sections by number (e.g. "per §4 High risk") for the rest of the pipeline.

### 1d — Requirement Gap Analysis

Run the checklist in `TEST_DESIGN_GUIDE.md` §1 against `CARD_TITLE` + `ACCEPTANCE_CRITERIA`.
This **replaces** the old bare "no AC found" check — the missing-AC row is §1's first row and
is the most severe: if it fires, skip evaluating the rest of the table and ask only that.

Fold every gap that actually applies into **one** consolidated question — the same message as
any unresolved Phase 0 gaps, not a second round:
> "No Acceptance Criteria found on this card. What should be tested?" (only if AC is entirely
> missing), or, when AC exists but has gaps: one line per applicable §1 row, e.g. "AC mentions
> a 'reference code' but doesn't state its length/format — what's the exact rule?"

Skip this step's question entirely if the AC is already precise and complete on every §1
row — do not manufacture questions to fill the message.

Wait for the response before proceeding to Phase 2.

---

## Phase 2 — UI Testing (optional)

**Skip if `RUN_UI_TEST = false`** — note "UI Testing: skipped" in final summary.

If running:
> **[Step 1/4] UI Testing — comparing [CARD_ID] live app against Figma...**

Read `.claude/skills/QE-Web/ui-test-figma.md` in full and carry out its full procedure inline.
Pre-fill its questions using collected values:
- Figma URL → `FIGMA_URL`
- App URL → `APP_URL`
- Credentials → `USERNAME` / `PASSWORD`

Run token tracking `ui_testing` checkpoint after completion.

Brief summary:
> "UI Testing complete — [N] failures, [N] warnings. Proceeding to manual tests."

---

## Phase 3 — Manual Test Execution + Automation Hint Capture

> **[Step 2/4] Manual Testing — executing tests for [CARD_ID]...**

Initialize an empty hints log in memory:
```
HINTS = {
  card: CARD_ID,
  baseUrl: BASE_URL,
  appUrl: APP_URL,
  pages: [],
  elements: {},    // keyed by page URL
  testCases: [],
  notes: []
}
```

### 3a — Generate Test Plan (risk-scoped, coverage-dimension-driven)

Before drafting test ideas, check each AC item for a stated entry point (menu path, URL,
button/link name). Per the **Test Data & Entity Selection Rules** above, do not scan `src/`
to infer a missing one — collect a single navigation question per missing entry point and
fold it into the confirmation prompt below instead of guessing.

**Step 1 — Classify risk tier and select dimensions.** Using `TEST_DESIGN_GUIDE.md` §2 (Feature
Signal → Coverage Dimension Trigger Table), scan `CARD_TITLE` + `ACCEPTANCE_CRITERIA` for
signal keywords and turn on the matched dimensions. No signal matched → default set only
(Functional Positive/Negative + UI/UX States + one Boundary check). Then classify the card's
risk tier per §4 (High/Medium/Low) from the same signals — this sets how many tests each
triggered dimension gets, not just which dimensions run.

**Step 2 — Draft numbered test ideas per dimension.** Walk the §5 Test Scenario Identification
Framework (the 10 "what can/can't/who/what happens" questions) once, and for each dimension
turned on in Step 1, draft the number of tests §4's tier calls for. Concretely, for a Medium-risk
card this typically looks like: 1–2 Functional Positive, 1–2 Functional Negative, one Boundary
or Equivalence set per §6 if the AC states or implies a limit, one UI/UX States pass (§8) on the
card's key screen, plus one test per other triggered dimension (Permissions, API, Database,
State/Workflow, etc.). High-risk cards double the per-dimension count and add Security-oriented
+ Database checks unconditionally per §4. Low-risk cards (copy/label-only) skip straight to
Functional (positive + one negative) plus one regression spot-check — do not force the other
dimensions onto a low-risk card.

Cap exploratory ideas (§5 Q10) at one per plan, clearly tagged `[exploratory]`, so they don't
inflate the "planned" test count used for the Exit Criteria check later (§9).

If `OPEN_KNOWN_BUGS` (from Phase 1) contains a row whose Title overlaps this card's module/page
keywords, add one retest test tagged `[retest: {BUG-ID}]` — this is what §9's retest check
verifies actually happened.

Do not draft dedicated regression tests here — that's qa-agent Step 5's job (Covered Flows
overlap), triggered automatically after this skill returns. §5 Q9 exists only to flag *that*
regression may apply, not to author it now.

**Risk-based execution ordering** — pull 2–5 module/page keywords straight out of the AC/card
title you already read (e.g. "login", "checkout"; no extra fetching), then run one script call:

```bash
node .claude/skills/QE-Web-QA-Agent/toolkit/qa-toolkit.cjs risk-score --product {PRODUCT_FOLDER} --modules "kw1,kw2,kw3"
```

Order the T-01, T-02... list so tests touching the highest-risk module come first. On a
product's first run (no git history / no known bugs yet) every module scores 0 — keep the
natural drafting order in that case, no need to mention it. (This reorders the tests drafted in
Step 2 — it doesn't decide how many exist; that's §4's job, run once, not repeated per module.)

Show as a compact table (T-01, T-02 ... with name, dimension tag, and expected outcome),
risk-ordered. Ask: `"Ready to run these tests? (yes / no or edit)"` — include any missing
navigation questions from above in this same message (§1 gap questions were already asked
and resolved in Phase 1d — don't re-ask them here).
Proceed on confirmation.

### 3b — Setup Browser + Capture Login Selectors

**Before navigating — check for an existing session:**
```bash
ls .playwright-session.json 2>/dev/null && echo "SESSION_EXISTS" || echo "NO_SESSION"
```

**If `.playwright-session.json` exists:**
- Use it for all CLI screenshots in Phase 3c — skip the entire login flow below
- Verify the session is still valid by navigating to `APP_URL`:
  - If the dashboard/home loads → session valid, proceed directly to 3a test plan generation
  - If redirected to login → session expired, delete the file and proceed with login below

**If no session file (or session expired):**

1. `browser_navigate(url: APP_URL)`
2. `browser_wait_for(state: "networkidle")`

**If login required:**
3. `browser_snapshot()` — ONE allowed snapshot to read login form selectors
4. Record all login elements found into `HINTS.elements[LOGIN_URL]`:
   - For each input/button interacted with, note: tag, locator used, role/text, data-testid if present
5. Fill email → `browser_fill`
6. Fill password → `browser_fill`
7. Click login button → `browser_click`
8. `browser_wait_for(state: "networkidle")`

**If OTP screen appears:**
9. Click first OTP box → `browser_click`
10. `browser_type(text: OTP_CODE)` — the `QA_OTP_CODE` value from `.env` (ask once if unset)
11. Click verify → `browser_click`
12. `browser_wait_for(state: "networkidle")`

Confirm login success before proceeding.

**Save session state immediately after successful login:**
```javascript
browser_evaluate({
  expression: `(() => JSON.stringify({
    ls: Object.fromEntries(Object.entries(localStorage)),
    ss: Object.fromEntries(Object.entries(sessionStorage)),
    url: window.location.href
  }))()`
})
```
Write the result to `.playwright-session.json`. All Phase 3c CLI screenshots must now use:
```bash
npx playwright screenshot \
  --storage-state .playwright-session.json \
  --browser chromium \
  --full-page \
  --wait-for-timeout 2000 \
  "TARGET_URL" \
  outputs/screenshots/T-[N]-[status].png
```

Add to `HINTS.pages`: `{ url: LOGIN_URL, description: "Login page" }`
Add to `HINTS.notes`: any special login behavior observed (OTP type, error format, redirect URL)

### 3c — Execute Tests + Log Automation Hints

For each test T-01, T-02, ...:

1. Navigate to the feature area via Playwright MCP (preserves session)
2. Add current URL to `HINTS.pages` if not already present

2a. **DOM fingerprint check — once per distinct URL, the first time you land on it this run:**
   ```javascript
   browser_evaluate({ expression: `
     Array.from(document.querySelectorAll('[data-testid]')).map(el => el.getAttribute('data-testid')).join(',')
   ` })
   ```
   ```bash
   node .claude/skills/QE-Web-QA-Agent/toolkit/qa-toolkit.cjs fingerprint --product {PRODUCT_FOLDER} --url "CURRENT_URL" --testids "RESULT_FROM_ABOVE"
   ```
   - `UNCHANGED` → this page's selectors haven't moved since a prior run. Skip step 3's
     per-interaction element capture for this page entirely (still perform the actual test
     interactions and assertions — only the *hint-recording* is skipped). Add one line to
     `HINTS.notes`: `"Elements on {url}: unchanged — reused prior fingerprint, capture skipped."`
   - `NEW` or `CHANGED` → proceed with full per-interaction capture in step 3 below, same as always.

3. For each browser interaction (`browser_fill`, `browser_click`, `browser_select_option`):
   - Execute the interaction
   - Immediately run element capture (zero-token, targeted JS):
     ```javascript
     browser_evaluate({ expression: `
       (() => {
         const el = document.activeElement;
         if (!el || el === document.body) return null;
         return {
           tag:    el.tagName.toLowerCase(),
           id:     el.id || null,
           testid: el.getAttribute('data-testid') || null,
           role:   el.getAttribute('role') || el.type || null,
           text:   el.innerText?.trim().slice(0, 60) || el.value?.slice(0, 60) || null,
           name:   el.name || null,
           type:   el.type || null,
           nth:    [...document.querySelectorAll(el.tagName)].indexOf(el)
         };
       })()
     ` })
     ```
   - Append result to `HINTS.elements[CURRENT_URL]` with a label (e.g. "email input", "submit button")

4. Take screenshot via Playwright CLI (zero response tokens):
   ```bash
   mkdir -p outputs/screenshots
   npx playwright screenshot \
     --browser chromium \
     --full-page \
     --wait-for-timeout 2000 \
     "CURRENT_URL" \
     outputs/screenshots/T-[N]-[pass|fail|observation].png
   ```

5. Assert expected result via targeted `browser_evaluate` on specific selectors. If this
   test's dimension tag (from 3a) is UI/UX States, note which of the `TEST_DESIGN_GUIDE.md`
   §8 states (Initial/Loading/Empty/Success/Error/Disabled) were actually observed and their
   result — skip states genuinely unreachable in this test, don't force them.

6. Log test result (to file only, not chat):
   `T-N | title | dimension | status | expected | actual | screenshot path`

7. Append to `HINTS.testCases`:
   ```
   { id: "T-N", name: "...", status: "PASS|FAIL|OBSERVATION|BLOCKED",
     actions: ["fill email", "click submit", "type OTP"],
     url: "CURRENT_URL" }
   ```

Show only running count in chat: `T-01 ✅ T-02 ❌ T-03 ✅ ...`

Status codes: ✅ PASS | ❌ FAIL | ⚠️ OBSERVATION | 🔒 BLOCKED

Never skip a test.

### 3d — Save Execution Report

Save to `outputs/test-execution-[CARD_ID]-[YYYYMMDD].md`:
- Tester, date, environment, session duration
- All test results with expected vs actual
- Screenshot references
- Observations, risks

### 3e — Save Automation Hints File

After all tests complete, write `outputs/automation-hints-[CARD_ID]-[YYYYMMDD].md`:

```markdown
# Automation Hints — [CARD_ID]
Generated: [date] by manual-testing skill
Card: [JIRA_URL]
Base URL: [BASE_URL]

## Environment
App URL: [APP_URL]
Login: credentials in .env (never written here)

## Pages Visited
| URL | Description |
|-----|-------------|
| [url] | [description] |

## Elements Discovered

### [Page Name] ([URL])
| Element | Locator | Method | data-testid | Notes |
|---------|---------|--------|-------------|-------|
| [label] | [selector] | [positional/testid/role/text] | [value or none] | [observations] |

## Test Cases Executed
| ID | Name | Status | Key Actions |
|----|------|--------|-------------|
| T-01 | [name] | PASS | [comma-separated action list] |

## Automation Notes
[freeform observations: OTP behavior, error message format, API seeding needed,
 redirect URLs, any elements that need data-testid added, etc.]
```

Tell the user (one line):
> "Automation hints saved: `outputs/automation-hints-[CARD_ID]-[YYYYMMDD].md`"

Run token tracking `test_execution` checkpoint.

### 3f — Write Selector Context Update

After saving the automation hints file, silently update the product context.

`PRODUCT_FOLDER` was already derived in Phase 1 — reuse it, don't re-derive.

```
CONTEXT_FILE = .claude/skills/QE-Web-QA-Agent/product_context/{PRODUCT_FOLDER}/context.md
```

**If context file exists:**
1. For each entry in `HINTS.elements` — append one row to `Element Selectors` if the Element Label is not already present:
   - Element Label | Page URL | Locator | Method (testid/role/css) | data-testid value or "none" | Card ID
2. For each entry in `HINTS.pages` — if the URL is a new module pattern not seen before, add a note to `Environment Notes` with the URL and its description

Use the Edit tool to append rows — do not overwrite any existing content.

**If context file does not exist — skip silently.** qa-agent Step 6 will create it at the end of the run.

One-line confirmation (only if rows were actually added):
```
Selectors added to product context ({N} elements merged).
```

---

## Phase 4 — Bug Reporting (drafted automatically, posted only on confirmation)

> **[Step 3/4] Bug Reporting — drafting a bug comment for [CARD_ID]...**

Do NOT invoke `.claude/skills/QE-Shared/bug-reporting.md`. Draft the bug comment directly from test
execution data — this keeps context contiguous and avoids a second skill invocation.
Per the **Jira Write Rule** in `SKILLS_CONTEXT.md`: every bug found this run is logged
as **one comment on the card already under test (`CARD_ID`)** — never a new Jira issue
— and that comment is only posted after the user confirms it.

**Step 4a — Build a bug entry for each ❌ FAIL and ⚠️ OBSERVATION**

Derive all fields from test execution data — no user input needed. Fields follow
`TEST_DESIGN_GUIDE.md` §7:

| Field | Source |
|-------|--------|
| Summary | `"T-{N}: {test name} — {actual outcome in one line}"` |
| Environment | `APP_URL` + environment name from product context (staging/dev/prod) |
| Preconditions | Login state + any setup steps from the test case (e.g. role, prior state) |
| Description (Steps/Expected/Actual) | Steps from test case + expected vs actual from execution log |
| Severity | AC explicitly failed → High · Assertion failed → Medium · Observation → Low |
| Priority | High-risk dimension (§4) failing → High · otherwise matches Severity |
| Test data used | The specific values/entities used for this test (never credentials) |
| Build/version | `CARD_ID` + run date (stands in for a separate build number) |
| Screenshot | Match `outputs/screenshots/T-{N}-*.png` by test ID — use exact filename |

**Step 4a.1 — Duplicate check (one script call per failure, no user input needed)**

Test names are derived from the AC, not typed by a person, but AC text copied from Jira can
still contain quotes or symbols — never inline free text into a shell command. Write it with
the Write tool first, then reference the file:

```
Write outputs/.dupcheck-tmp.txt containing: T-{N}: {test name}
```
```bash
node .claude/skills/QE-Web-QA-Agent/toolkit/qa-toolkit.cjs dup-bug --product {PRODUCT_FOLDER} --summary-file outputs/.dupcheck-tmp.txt
```

`NO_DUPLICATE_FOUND` → proceed normally. `POSSIBLE_DUPLICATE: {BUG-ID} (...) — "{title}"` →
still include the entry (a regression is a real, separately-trackable failure) but prepend
one line to its Description: `"⚠ Possibly related to {BUG-ID}: {title}"` for the triager.

**Step 4a.2 — PII / secrets scan (one script call per bug, before it leaves the machine)**

Same rule — the Description includes live-app text (error messages, field values) that can
contain anything. Write it to a file, never interpolate it into the command:

```
Write outputs/.piicheck-tmp.txt containing the composed Summary + Description text
```
```bash
node .claude/skills/QE-Web-QA-Agent/toolkit/qa-toolkit.cjs pii-scan --file outputs/.piicheck-tmp.txt
```

`CLEAN` → proceed silently. `FLAGGED: ...` → this is rare (test data occasionally captures a
real value) — pause only this one entry, show the flagged pattern types (never the raw match),
and ask once: `"This bug's description may contain real {types}. Redact and continue, or include as-is? (redact / as-is)"`.
Apply the user's choice, then continue to the next failure — do not stop the whole batch.
Delete both `outputs/.dupcheck-tmp.txt` and `outputs/.piicheck-tmp.txt` once the batch is done.

**Step 4b — Compose one comment for `CARD_ID`**

Give each entry a synthetic local ID `{CARD_ID}#T-{N}` (not a Jira key — there is no
separate issue) and combine every FAIL/OBSERVATION entry plus the run tally into one
comment body:

```
🧪 Manual Testing Complete

Results: {X} Pass | {X} Fail | {X} Observation | {X} Blocked | {X} Total

--- {CARD_ID}#T-{N}: {test name} ---
Severity: {severity} | Priority: {priority}
Environment: {environment}
Preconditions: {preconditions}
Steps: {steps}
Expected: {expected}
Actual: {actual}
Test data: {test data}
Screenshot: {filename}
(repeat the block above for every FAIL/OBSERVATION entry)

Report: outputs/test-execution-{CARD_ID}-{YYYYMMDD}.md
```

**Step 4c — Confirm before posting**

Show the composed comment and ask:
> "Post this as a comment on [CARD_ID]? ({N} Fail, {N} Observation) (yes / no / edit)"

Wait for an explicit reply — never post on silence. Apply requested edits and re-show
before asking again. Proceed to Step 4d only on an explicit **yes**.

**Step 4d — Post (only after confirmation)**

1. `addCommentToJiraIssue` on `CARD_ID` — one call, one comment.
2. Screenshot attachments — use Jira REST API curl (same method as bug-reporting
   SKILL.md Step 6b) targeting `CARD_ID`; skip silently if `.env` credentials not set.

**Step 4e — Announce**
```
Bug Reporting complete — {N} bug(s) logged as a comment on {CARD_ID}.
```

Run `bug_reporting` token checkpoint.

---

## Phase 5 — Test Charter (Publish)

> **[Step 4/4] Test Charter — generating and publishing for [CARD_ID]...**

Read `.claude/skills/QE-Shared/test-charter.md` in full and carry out its full procedure inline.
Pre-fill its context:
- Report file: `outputs/test-execution-[CARD_ID]-[YYYYMMDD].md`
- Card key, tester name, and date already known

Run token tracking `end + report + session` close-out after charter publishes.

---

## Phase 6 — Automation Handoff

After charter completes, run the `TEST_DESIGN_GUIDE.md` §9 Exit Criteria Quick Check:
confirm every planned test executed (BLOCKED is fine, silently-skipped is not), check whether
any bug just filed is High severity on a High-risk dimension (§4) and if so flag it as the
first line of the summary below, and — only if `OPEN_KNOWN_BUGS` (Phase 1) was non-empty and
overlapped this card — confirm the `[retest: {BUG-ID}]` test from 3a actually ran and note its
outcome. This does not block or gate anything — it only makes sure nothing gets buried in the
summary.

Show the final summary:

```
Manual Testing Complete — [CARD_ID]

  UI Testing (Figma)  : [completed / skipped]
  Manual Testing      : X Pass | X Fail | X Observation | X Blocked
  Bug Reporting       : [N] bug(s) logged as a comment on [CARD_ID] [+ "⚠ High-severity on {dimension}" if applicable]
  Test Charter        : [published URL or "saved locally"]
  Automation hints    : outputs/automation-hints-[CARD_ID]-[YYYYMMDD].md
```

**If AUTO_APPROVE = true (called from qa-agent full pipeline):**

Do NOT ask. Immediately chain to automation:
> "Auto-invoking Automation Agent — generating BDD tests from execution results.
> Hints file ready: `outputs/automation-hints-[CARD_ID]-[YYYYMMDD].md` — DOM re-discovery skipped for captured elements."

Read `.claude/skills/QE-Web/automation.md` in full and carry out its full procedure inline,
args: [CARD_ID]  AUTO_APPROVE=true  hints: outputs/automation-hints-[CARD_ID]-[YYYYMMDD].md

**If AUTO_APPROVE = false (standalone run):**

Ask once:
> "Would you like to run the **Automation Agent** now to generate BDD tests from these results?
> The hints file is ready — DOM re-discovery will be skipped for captured elements.
> (yes / no)"

- **If yes:** Read `.claude/skills/QE-Web/automation.md` in full and carry out its full
  procedure inline, with the hints file path.
- **If no:** exit with the summary above.

---

## Chat Output (Minimized)

Show in chat: phase announcements (1 line), test count running total, failure details only, the bug comment shown at the Step 4c confirmation gate, final summary.

Do NOT stream: full charter text, all test results (save to file), full bug reports, verbose execution logs.

---

## Error Handling

| Situation | Action |
|-----------|--------|
| Jira card not found | Ask user to verify key |
| Auth fails | Stop, ask to verify credentials |
| Feature not deployed | Mark related tests 🔒 BLOCKED, continue |
| AC missing | Ask user to describe what to test |
| Playwright MCP unavailable | Stop, ask user to confirm it is running |
| Figma URL missing / user says no | Skip UI Testing, note in final summary |
| `browser_evaluate` returns null for element | Log "element not captured" in hints, continue |
| User replies "no" at Step 4c | Do not post. Ask whether to edit and re-show, or skip bug reporting for this run |
| Comment post fails | Report the failure, ask whether to retry |
