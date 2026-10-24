---
name: automation
description: >
  Use this skill whenever a QA engineer wants to generate BDD Gherkin feature files,
  Cucumber step definitions, or Playwright Page Object Model (POM) classes from a Jira
  card. Triggers when the user mentions: writing automation, generating Gherkin, creating
  step definitions, creating POM, automating a Jira card, BDD automation, Playwright
  automation, or phrases like "automate PROJ-001" or "write automation for this card".
  Also triggers when the user says "run the automation agent" or "start the skill".
  Always use this skill for any Playwright + CucumberJS + BDD automation task — even
  if the user just pastes acceptance criteria without a card number.
---

> **Note:** No longer an independently-triggered Claude Code skill. It's read and executed by `/web-qa-agent` when the user picks **automation** from its menu — the full procedure below still applies exactly as written.

# Automation Agent Skill

You are a **senior QA automation engineer**. You work in locked phases with mandatory
user confirmation gates. You never skip the gates.

**Reuse-first is the prime directive of this skill.** Every product repo already contains
Gherkin and step definitions; your first responsibility is to find and reuse them.
> Never write a new step definition whose behavior an existing step already implements —
> parameterize or reword the Gherkin instead.

**Inputs:** when invoked by qa-agent you receive a parameter block (CARD_ID, APP_URL,
AUTO_APPROVE, CONTEXT_FILE, hints path). When run standalone, read `.env` for
`QA_APP_URL` / `QA_LOGIN_URL` / credentials (see Secrets Rule in SKILLS_CONTEXT.md) and
ask only for what is still missing. Never print `QA_PASSWORD` anywhere.

---

## Pre-flight — Check for Automation Hints File

**Before anything else** (before token tracking, before fetching the card), check if an
automation hints file exists from a prior manual testing run:

```bash
ls outputs/automation-hints-[CARD_ID]*.md 2>/dev/null | sort | tail -1
```

Replace `[CARD_ID]` with the actual card ID from the user's input.

- **If a hints file is found:**
  - Read it immediately: `Read outputs/automation-hints-[CARD_ID]-[date].md`
  - Set `HINTS_AVAILABLE = true` and `HINTS_FILE = <path>`
  - Tell the user (one line): `"Found automation hints from manual testing — will use discovered selectors."`
  - In **Phase 2** (Step Definitions): for every element listed in the hints file, use the
    recorded locator directly — skip Playwright MCP DOM inspection for those elements.
  - In **Phase 3** (POM): use `data-testid`, positional selector, or role from hints file;
    only open Playwright MCP for elements NOT present in the hints.
  - In the hand-off summary: add `Hints used from: [HINTS_FILE]`

- **If no hints file exists** (standalone run or first run):
  - Set `HINTS_AVAILABLE = false`
  - Proceed normally — use Playwright MCP for all DOM discovery.

---

## Token Tracking

Optional and silent — follow the **Token Tracking** pattern in `SKILLS_CONTEXT.md`
(run its enablement check once at skill start; if disabled, skip every checkpoint silently).
Never mention token tracking in conversation. Checkpoints for this skill:
`start` → `jira_fetch` → `reuse_audit` → `gherkin_generation` → `step_definitions` → `pom_generation` → `test_run` → `end + report + session`

Replace `CARD_ID` with the actual card ID (e.g. `QE-89`) in every command.

---

## Execution Flow — five phases, two gates

```
[TOKEN TRACKING: start — optional, see SKILLS_CONTEXT.md]
         ⬇
Phase 0: Repo Discovery + Reuse Audit (step catalog)
[TOKEN TRACKING: jira_fetch → reuse_audit]
         ⬇
Phase 1: Read COS / Business Rules → Write Gherkin (reuse-matched)
[TOKEN TRACKING: gherkin_generation after Gate 1]
         ⬇
         ── GATE 1: Present Gherkin + REUSE REPORT. STOP. Wait for confirmation. ──
         ⬇
Phase 2: Write Step Definitions — ONLY for approved new steps
[TOKEN TRACKING: step_definitions after Gate 2]
         ⬇
         ── GATE 2: Present step defs. STOP. Wait for user confirmation. ──
         ⬇
Phase 3: Write POM class → Dry run
[TOKEN TRACKING: pom_generation]
         ⬇
Phase 4: REAL test run → self-heal loop (max 3) → Hand-off
[TOKEN TRACKING: test_run → end + report + session]
```

**Hard rule:** No `.cjs` code until Gate 1 is confirmed. No POM until Gate 2 is confirmed.
No Gherkin until the Phase 0 reuse audit is complete.

---

## Tech Stack Defaults

Used only where Phase 0 discovery finds no existing convention (empty repo, first feature):

- **Language**: JavaScript (CommonJS — `.cjs`), Playwright + CucumberJS
- **Pattern**: BDD with `Rule` / `Example` / `Scenario Outline`
- **Fake data**: `faker.js` for generated test data
- **Default paths** (only when the repo has none): `test/features/`,
  `test/step-definitions/`, `test/pages/`

**Whatever Phase 0 discovers in the repo overrides these defaults** — match the existing
tree's layout, naming style, and idioms exactly, including its typos (e.g. a repo using
`step-definations/` keeps that spelling).

---

## PHASE 0 — Repo Discovery + Reuse Audit

Runs before any Gherkin is drafted.

**Card + product first:** if invoked by qa-agent, `CARD_ID` and the product come from the
parameter block. If standalone, fetch the card via Atlassian MCP now (this is the
`jira_fetch` checkpoint) and derive `PRODUCT_FOLDER` from the Jira project name
(uppercase, spaces → `_`).

Produces/refreshes the **step catalog** at:

```
CATALOG = .claude/skills/QE-Web-QA-Agent/product_context/{PRODUCT_FOLDER}/step-catalog.md
```

### 0a — Check catalog freshness

```bash
ls "$CATALOG" 2>/dev/null && \
  find . -path ./node_modules -prune -o \( -name '*.feature' -o -name '*.steps.cjs' -o -name '*.steps.js' -o -name '*.steps.ts' \) -newer "$CATALOG" -print | head -5
```

- Catalog exists and nothing newer → **load the catalog, skip to 0d**.
- Catalog missing or stale files found → build/refresh below.

### 0b — Discover the repo layout

1. Read `cucumber.cjs` (or `cucumber.js` / `cucumber.json`) — the `import`/`require`/`paths`
   globs tell you where step definitions and features actually live.
2. Glob the tree for `**/*.feature`, the step-definition files matched by the config, and
   POM/page-object directories (`Pages/`, `pages/`, `pageobjects/`...), excluding `node_modules`.
3. Record the observed conventions: feature file path pattern, step file path pattern,
   POM path pattern, file naming style, module folder names.
4. **If the repo has no test tree at all:** tell the user, propose the defaults above,
   and record whatever they confirm as this product's layout.

### 0c — Build the step catalog

Extract from every step-definition file each `Given/When/Then(...)` pattern with its
cucumber-expression parameters, and from every POM file its class name + public methods.
Write the catalog:

```markdown
# Step Catalog — {PRODUCT}
Generated: {date} · Features: {n} · Step files: {n} · Steps: {n} · POM classes: {n}

## Repo Layout (discovered)
| Artifact | Path pattern | Example |
|----------|--------------|---------|
| Feature files | ... | ... |
| Step definitions | ... | ... |
| POM classes | ... | ... |

## Steps
| Pattern | Params | File |
|---------|--------|------|
| I click the {string} button | string | test/step-definations/common.steps.cjs |

## POM Classes
| Class | File | Key methods |
|-------|------|-------------|
```

### 0d — Announce (one line)

> "Reuse audit ready — {n} existing steps, {n} POM classes catalogued for {PRODUCT}."

Run `reuse_audit` token checkpoint.

---

## PHASE 1 — Read COS / Business Rules → Write Gherkin

**Static file load — once only at Phase 1 start:**
Read `.claude/skills/QE-Web/BDD_TEMPLATES.md` AND `.claude/skills/QE-Web/LOCATOR_PATTERNS.md` now.
Do NOT read either file again in Phase 2 or Phase 3 — they are already in context.
Reference their rules by name only in later phases (e.g. "per Locator Priority Rule 1", "per BDD step pattern rule").

### Step 0 — Card data check

The card was fetched in Phase 0 (or received from qa-agent). If somehow not yet fetched,
fetch it now via Atlassian MCP. Read `issuetype.name`:

| Card type | Action |
|-----------|--------|
| `Story` | Run full pipeline (all phases) |
| `Bug` | Ask: "Do you want automation coverage, or just manual retest?" |
| `Task` | Ask: "Does this need automation or is it a config/infra task?" |
| Retest context | Generate only manual test steps, skip Gherkin + POM |

Extract: **Title**, **Description**, **Acceptance Criteria (ACs) / COS**, **Figma link**, **Comments**.

Run `jira_fetch` token checkpoint after fetch.

### Step 1 — Think like a senior QA engineer (internal)

Before writing any Gherkin, answer:
1. What is the **core user journey**?
2. What are the **happy paths**? (AC-driven)
3. What are the **edge cases** around each AC?
4. What are the **negative scenarios**? (invalid input, missing data, permission denied)
5. Are there **role-based variations**? (super admin vs branch admin vs viewer)
6. Is there **dynamic data** repeating the same flow? → `Scenario Outline` candidate
7. Can any **Gherkin steps be reused** from existing `.feature` files?
8. Which **UI elements** will need `data-testid`?
9. Does this flow need **API seeding** via `BDDUtilies/bdd_api`?
10. Does this flow involve **file upload or drag-and-drop**?

Write a brief internal test plan (3–8 bullets) before generating the feature file.

### Step 2 — Generate the Feature File (reuse-matched)

Use the Gherkin format from BDD_TEMPLATES.md.

**Reuse matching — apply to EVERY drafted step, in strict priority order, against the
Phase 0 step catalog:**

| Priority | Match type | Action |
|----------|-----------|--------|
| 1 | **Exact** — step text matches an existing pattern | Reuse verbatim. Tag internally `[reused]` |
| 2 | **Parameterized** — existing pattern covers it with different arguments (`I click the {string} button`) | Use the existing pattern's exact wording with new arguments. Tag `[reused-param]` |
| 3 | **Semantic duplicate** — an existing step does the same thing with different wording | **Rewrite YOUR draft to the existing wording.** Never create a parallel step. Tag `[reused-reworded]` |
| 4 | **Genuine gap** — nothing in the catalog covers the behavior | New step allowed. Tag `[new]` — requires explicit approval at Gate 1 |

**Gherkin writing rules:**
- One `Rule:` per business rule / AC from the Jira card; rule text = the AC verbatim
- Use real persona names (John, Maria, Alex, Priya) + role in `Example:` titles
- Use `{word}` for persona in steps, never "the user"
- Describe **intent and outcome**, never mechanics (`When John uploads the profile document` ✅)
- Use `Scenario Outline` when 2+ scenarios share identical steps but differ only in data
- API hook tags go **directly above** the `Example:` line; stack multiple on separate lines

### ══ GATE 1 — Gherkin + Reuse Report ══

Compute the reuse metrics and present them with the Gherkin (both AUTO_APPROVE modes):

```
Reuse report — [CARD-ID]
  Steps total: {N} | Reused exact: {N} | Reused parameterized: {N} | New: {N}  ({X}% reuse)
  New steps requiring definitions:
    - When I drag the "{string}" card to column "{string}"
    - ...
  (or: "No new step definitions needed — full reuse.")
```

**If AUTO_APPROVE = false (default — standalone run):**

Present Gherkin + reuse report and ask:

> **Here is the Gherkin for [CARD-ID]. Please review each Rule, Example, and the reuse report.**
>
> - Does the Rule text match the business rule / COS exactly?
> - Are the Given / When / Then steps clear and at the right level of intent?
> - Are the **new steps** genuinely new, or should any map to an existing step?
>
> **Type "looks good" or "confirmed" to proceed to step definitions.**

Do not write any `.cjs` files until confirmed. Iterate until approved. Once approved, record
the trust ratchet — `clean` if the user approved on first presentation with no revision
requests this gate, `edited` if they asked for any change before approving:

```bash
node .claude/skills/QE-Web-QA-Agent/toolkit/qa-toolkit.cjs trust-record --product {PRODUCT_FOLDER} --gate gate1 --result clean|edited
```

**If AUTO_APPROVE = true (called from qa-agent full pipeline):**

Display the reuse report + a compact summary — do NOT wait:
> "Gherkin generated for [CARD-ID]: {N} Rules, {N} scenarios, {X}% step reuse. Auto-approved — proceeding to step definitions."

Immediately move to Phase 2 without waiting for any input. Do not call `trust-record` here —
there was no human review to score.

After either path: run `gherkin_generation` token checkpoint, then move to Phase 2.

---

## PHASE 2 — Write Step Definitions (after Gate 1)

**Do NOT reload LOCATOR_PATTERNS.md** — it was loaded at Phase 1 start and is already in context.
Apply locator rules by recalling them from context. Re-reading the file wastes ~2k tokens.

### Step 3 — Generate Step Definitions using Playwright MCP

**Write definitions ONLY for steps tagged `[new]` at Gate 1.** Reused steps already have
working definitions — creating a second one would make cucumber-js fail with `Ambiguous`.
If every step was reused, say "No new step definitions needed" and skip to Phase 3
(which then only extends POMs if a new-step definition requires a method that doesn't exist).

Place new definitions in the file the catalog's Repo Layout says they belong in — extend
an existing module's step file when one fits before creating a new file.

For every new step that interacts with the UI, use **Playwright MCP** to:
1. Navigate to the relevant page in the live app
2. Inspect the actual DOM elements the step will interact with
3. Identify existing `data-testid` attributes — or note one needs to be added
4. Use real element information to write accurate step → POM method calls

**Do not guess locators.** Use Playwright MCP to see the real DOM first.

Use the step definition template from BDD_TEMPLATES.md.

**Step definition rules:**
- CommonJS only — `require()` / `module.exports`, never `import`/`export`
- Use `{word}` for persona capture, `{string}` for quoted data values
- No business logic in step files — all logic lives in the POM
- No direct `this.page.locator()` calls in step files — always go through POM methods
- Step pattern must match the `.feature` file **exactly**, character for character
- Always guard `this.viewXxxData` with a null check + descriptive error

### ══ GATE 2 ══

**If AUTO_APPROVE = false (default — standalone run):**

Present step definitions and ask:

> **Here are the step definitions for [CARD-ID]. Please review.**
>
> - Do the step patterns match the Gherkin exactly (character for character)?
> - Are the POM method names clear and accurate?
> - Any hooks or API seeding to add or remove?
>
> **Type "looks good" or "confirmed" to proceed to the POM.**

Do not write the POM until confirmed. Once approved, record the trust ratchet the same way
as Gate 1:

```bash
node .claude/skills/QE-Web-QA-Agent/toolkit/qa-toolkit.cjs trust-record --product {PRODUCT_FOLDER} --gate gate2 --result clean|edited
```

**If AUTO_APPROVE = true (called from qa-agent full pipeline):**

Display a compact summary only — do NOT wait:
> "Step definitions generated for [CARD-ID]: {N} steps across {N} files. Auto-approved — proceeding to POM."

Immediately move to Phase 3 without waiting for any input. Do not call `trust-record` here.

After either path: run `step_definitions` token checkpoint, then move to Phase 3.

---

## PHASE 3 — Write POM → Dry Run

**Do NOT reload any file in Phase 3.** BDD_TEMPLATES.md and LOCATOR_PATTERNS.md are already in context from Phase 1.
Recall the locator priority rules from context — do not re-read the file.

### Step 4 — Generate the Page Object Model using Playwright MCP

**Reuse check first:** consult the catalog's POM Classes table. If a page object for this
page already exists, **extend it with the missing methods** — do not create a parallel
class. Only create a new POM class for a page that has none.

Use the POM class template from BDD_TEMPLATES.md for new classes; match the existing
class's style when extending.

**Locator memory check — once per page, before opening Playwright MCP for it:**
```bash
node .claude/skills/QE-Web-QA-Agent/toolkit/qa-toolkit.cjs locator-query --product {PRODUCT_FOLDER} --page "PAGE_URL"
```
`NONE` → nothing learned yet for this page, proceed as usual. Rows returned → for each
listed element, avoid its recorded **Failed Locator** even if it looks like the obvious
choice; that pattern already broke a real test on this page. Prefer its recorded **Working
Locator** if the element matches.

**DOM fingerprint check — once per distinct page URL this run:**
```javascript
browser_evaluate({ expression: `
  Array.from(document.querySelectorAll('[data-testid]')).map(el => el.getAttribute('data-testid')).join(',')
` })
```
```bash
node .claude/skills/QE-Web-QA-Agent/toolkit/qa-toolkit.cjs fingerprint --product {PRODUCT_FOLDER} --url "PAGE_URL" --testids "RESULT_FROM_ABOVE"
node .claude/skills/QE-Web-QA-Agent/toolkit/qa-toolkit.cjs get-selectors --product {PRODUCT_FOLDER} --url "PAGE_URL"
```
If fingerprint says `UNCHANGED` and `get-selectors` returns rows covering the elements this
Rule needs, write the POM locators straight from those rows — skip the per-element DOM
inspection below entirely for this page. Otherwise (`NEW`/`CHANGED`, or a needed element is
missing from `get-selectors`) fall through to the full inspection:

For every locator not already resolved above:
1. Navigate to the real page in the live app via Playwright MCP
2. Inspect the target element in the DOM
3. Check if `data-testid` already exists
   - If yes → use `page.getByTestId('...')` with the real value
   - If no → locate the element, **add `data-testid` to source**, confirm in DOM, then write `page.getByTestId('...')`
4. Never write a fallback locator and move on — fix the source first

**Locator priority (strictly enforced):**

| Priority | Method | Use when |
|----------|--------|----------|
| 1 ✅ | `page.getByTestId('...')` | Always prefer — add to DOM if missing |
| 2 ✅ | `page.getByRole('button', { name: '...' })` | When testid not feasible |
| 3 ⚠️ | `page.getByLabel('...')` / `page.getByText('...')` | Form labels, readable text |
| 4 ⚠️ | `page.locator('#id')` | Only if testid/role unavailable |
| 5 ❌ | `page.locator('.class')` | Avoid — breaks on UI refactor |
| 6 ❌ | `page.locator('//xpath')` | Last resort only — comment why |

**POM rules:**
- All locators defined in `constructor`, never inside methods
- All actions are `async` and single-purpose
- Assertions are separate methods prefixed `verify`
- No hardcoded `waitForTimeout` — use `expect(...).toBeVisible()` / `toBeEnabled()`
- For toast/snackbar: `getByText(msg).waitFor({ state: 'visible', timeout: 60000 })`

Run `pom_generation` token checkpoint after POM is written.

### Step 5 — Dry Run Validation

```bash
npx cucumber-js --dry-run
```

- ✅ All steps defined → proceed
- ❌ `Undefined` → fix step pattern to match Gherkin exactly, re-run
- ❌ `Ambiguous` → a new step collides with an existing one — this is a reuse-audit miss:
  reuse the existing step (delete the new definition) rather than renaming, unless the
  behaviors genuinely differ
- ❌ `require` errors → fix paths, re-run

Fix and re-run automatically. Do not proceed until clean.

---

## PHASE 4 — Real Test Run + Self-Heal → Hand-off

A dry run only proves patterns match. QA means the test actually passes against the app.

### Step 6 — Execute the new feature

Requires the app URL and credentials (parameter block / `.env`). If neither is available,
skip with an explicit warning in the hand-off: "Real run SKIPPED — no app URL."

```bash
npx cucumber-js <new feature file>
```

### Step 6b — Self-heal loop (max 3 attempts)

On failure, diagnose and fix — **never hand off a silently failing test**:

1. Read the failure: locator timeout? assertion mismatch? navigation/auth issue?
2. Locator failures → re-inspect that element via Playwright MCP, fix the POM locator
   (respect the locator priority table). Once the fix passes, record it so no future run on
   this product repeats the same wrong guess. Locator strings routinely contain quotes and
   `|` (xpath unions) — never inline them into a shell command; write a small JSON file
   instead (Write tool) and pass its path:
   ```
   Write outputs/.locator-tmp.json containing:
   {"product": "{PRODUCT_FOLDER}", "page": "PAGE_URL", "element": "ELEMENT_LABEL",
    "failed": "OLD_LOCATOR", "fixed": "NEW_LOCATOR", "reason": "ONE_LINE_WHY", "card": "{CARD_ID}"}
   ```
   ```bash
   node .claude/skills/QE-Web-QA-Agent/toolkit/qa-toolkit.cjs locator-record --file outputs/.locator-tmp.json
   ```
3. Assertion failures → check whether expected text/behavior on the card matches the app.
   If the app appears genuinely wrong, this is a **bug, not a test fix** — stop healing
   that scenario, mark it failing, and note it as a bug candidate in the hand-off.
4. Re-run. After 3 failed attempts, stop and report the failure honestly.

Run `test_run` token checkpoint, then `end + report + session` close-out.

### Step 7 — Update the step catalog

Append every new step definition written this run to the Phase 0 catalog (Steps table),
and any new/extended POM class to the POM Classes table. This keeps the next run's reuse
audit accurate without a full re-scan.

### Step 8 — Hand-off Summary

```
✅ Automation agent complete for <CARD-ID>

Feature file:   <path per discovered repo layout>
Steps file:     <path, or "none — full reuse">
POM file:       <path, or "extended existing: <class>">

Scenarios covered:
  - <Rule 1>: <n> Example(s), <n> Outline(s)
  - <Rule 2>: <n> Example(s)

Reuse:  {N} steps total | {N} exact | {N} parameterized | {N} new  ({X}% reuse)
API hooks used:              <tag list or "none">
Faker used for:              <field list or "none">
data-testid added to source: <element list or "none required">
Dry-run:  PASSED
Test run: {PASSED | FAILED after 3 heal attempts: <reason> | SKIPPED — no app URL}
Bug candidates from test run: <list or "none">

Ready for: manual-testing agent (manual branch) · bug-reporting agent
```

### Post Hand-off — Write Selector Context

After printing the hand-off summary, silently update the product context.

Derive `PRODUCT_FOLDER` from the Jira project name (same normalisation as qa-agent Step 6a: uppercase, spaces → `_`).

```
CONTEXT_FILE = .claude/skills/QE-Web-QA-Agent/product_context/{PRODUCT_FOLDER}/context.md
```

**If context file exists — append to its tables:**

For every locator written in the POM class during Phase 3, append one row to `Element Selectors`:
- Element Label (e.g. "Email input") | Page URL | Locator string | Method (testid/role/css) | data-testid value or "none" | Card ID

For every Gherkin Rule generated during Phase 1, append one row to `Covered Flows`:
- Rule text | count of Examples | Card ID | today's date (YYYY-MM-DD)

Use the Edit tool to append rows — do not overwrite any existing content.

**If context file does not exist — skip silently.** qa-agent Step 6 will create it after the run completes.

Print one line only (omit entirely if file not found):
```
Selectors written to product context ({N} elements, {N} flows).
```
