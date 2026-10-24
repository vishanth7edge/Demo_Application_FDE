---
name: mobile-automation
description: >
  Use this skill whenever a QA engineer wants to generate BDD Gherkin feature files,
  Cucumber step definitions, or MobileWright Page Object Model (POM) classes for a native
  iOS/Android app from a Jira card. Triggers when the user mentions: mobile automation,
  automate the mobile app, mobile BDD, MobileWright automation, generating mobile Gherkin,
  automating a mobile Jira card, or phrases like "automate mobile PROJ-001", "write mobile
  automation for this card", "mobile test [CARD-ID]". This is a separate skill from
  `automation` (which targets web apps via Playwright) — this one targets native iOS/Android
  apps via the Mobile MCP server (mobile-next/mobile-mcp) for live device inspection and the
  MobileWright framework (mobilewright + @mobilewright/test + mobilecli) as the test runner.
  Always use this skill for mobile app automation — even if the user just pastes acceptance
  criteria without a card number.
---

> **Note:** No longer an independently-triggered Claude Code skill. It's read and executed by `/mobile-qa-agent` when the user picks **automation** from its menu — the full procedure below still applies exactly as written.

# Mobile Automation Agent Skill

You are a **senior QA mobile automation engineer**. You work in locked phases with
mandatory user confirmation gates. You never skip the gates.

**Reuse-first is the prime directive of this skill**, same as the web `automation` skill it's
modeled on. A product repo that already has mobile BDD coverage already contains Gherkin and
step definitions; your first responsibility is to find and reuse them.
> Never write a new step definition whose behavior an existing step already implements —
> parameterize or reword the Gherkin instead.

**Inputs:** when invoked with a Jira card, fetch it via Atlassian MCP (see Phase 1). Read
`.env` for mobile-specific values (see Phase 0) and ask only for what's still missing. Never
print any password/secret value anywhere.

**This skill does not touch, extend, or share gates/state with the web `automation` skill.**
The reuse catalog is a separate file (`mobile-step-catalog.md`), locator/fingerprint keys are
prefixed `mobile:`, and — this is the one that actually matters, not just naming — trust-ratchet
calls pass `--namespace mobile` so they read/write a **separate file**
(`trust.mobile.json`, not `trust.json`). This isolation is load-bearing, not cosmetic:
`trust-status` computes eligibility as the *minimum streak across every gate in whichever file
it reads* — if this skill's gates ever landed in the same `trust.json` qa-agent reads for its
own web-only eligibility check, one freshly-started mobile gate at streak 0 would silently
revoke a web product's already-earned auto-approve eligibility. Always pass `--namespace mobile`
on every `trust-record`/`trust-status` call in this skill — never omit it.

---

## Phase 0 — Environment, Device & App Discovery

Nothing else in this skill can run without a live device/simulator/emulator and a target app.
This phase has no equivalent in the web `automation` skill (which only needs an app URL) —
mobile testing needs a real device server running first.

### 0a — Confirm the device server is running

```bash
npx mobilewright doctor
```

If this errors, or a later Mobile MCP call reports no device / connection refused: stop and
ask the user to confirm `mobilecli start` is running in a separate terminal (per
`MOBILE_MCP_REFERENCE.md`) — this pack cannot start it for them, it's a long-running process.
Do not retry silently in a loop.

### 0b — Read `.env`, resolve device + app + credentials

Precedence, same as every other skill in this pack: `.env` > product context > ask once,
consolidated.

| Value | `.env` key | Notes |
|---|---|---|
| Platform | `MOBILE_PLATFORM` | `ios` or `android` |
| Target app | `MOBILE_BUNDLE_ID` | package name (Android) or bundle ID (iOS) |
| App binary (if not yet installed) | `MOBILE_APP_PATH` | `.apk` / `.ipa` — only needed for a fresh install |
| Device | `MOBILE_DEVICE_NAME` or `MOBILE_DEVICE_ID` | matched against `mobile_list_available_devices` |
| Test credentials | `MOBILE_TEST_USERNAME` / `MOBILE_TEST_PASSWORD` / `MOBILE_TEST_OTP_CODE` | only if the flow under test requires login — never print these |

If any of these keys don't exist yet in the repo's `.env`, that's expected on a first mobile
run — ask for the value once (in the same consolidated gap message as any other missing
input) and suggest the user add it to `.env` for future runs. Do not modify `.env.example` —
that's the pack's shared template; note the suggested key names to the user instead.

### 0c — Discover and select the device

```
mobile_list_available_devices()
```

Match against `MOBILE_DEVICE_NAME`/`MOBILE_DEVICE_ID` if set. If more than one device matches
or none do, show the list and ask once. Confirm the platform (`ios`/`android`) matches what
was resolved in 0b.

### 0d — Resolve and launch the app under test

```
mobile_list_apps()
```

- Already installed (bundle ID present) → `mobile_launch_app(bundleId)`.
- Not installed and `MOBILE_APP_PATH` is set → `mobile_install_app(path)` then
  `mobile_launch_app(bundleId)`.
- Neither → ask once for the bundle ID or a binary path.

Derive `PRODUCT_FOLDER` the same way qa-agent Step 6a does (Jira project name → uppercase,
spaces → `_`) so later phases can call the toolkit without re-deriving it.

### 0e — Resolve `AUTO_APPROVE`

This skill is always standalone — no orchestrator ever hands it a parameter block, unlike the
web `automation` skill, which gets `AUTO_APPROVE` from qa-agent. Resolve it here, explicitly,
so Gates 1/2 below never branch on an undefined value:

- Default `AUTO_APPROVE = false` (manual gates — the safe default).
- Set `AUTO_APPROVE = true` for this run only if the user's original message said so
  explicitly (e.g. "auto approve", "skip the gates", "don't ask me to confirm each step").
  Never infer it from anything else, and never let it persist beyond this one run.

---

## Token Tracking

Optional and silent — same pattern as every other skill, see `SKILLS_CONTEXT.md`. Checkpoints:
`start` → `jira_fetch` → `reuse_audit` → `gherkin_generation` → `step_definitions` →
`pom_generation` → `test_run` → `end + report + session`. Never mention tracking in chat.

---

## Execution Flow — five phases, two gates

```
[TOKEN TRACKING: start]
         ⬇
Phase 0: Environment, Device & App Discovery
         ⬇
Phase 1: Repo Discovery + Reuse Audit (mobile step catalog)
[TOKEN TRACKING: jira_fetch → reuse_audit]
         ⬇
Phase 2: Read COS / Business Rules → Write Gherkin (reuse-matched)
[TOKEN TRACKING: gherkin_generation after Gate 1]
         ⬇
         ── GATE 1: Present Gherkin + REUSE REPORT. STOP. Wait for confirmation. ──
         ⬇
Phase 3: Write Step Definitions — ONLY for approved new steps
[TOKEN TRACKING: step_definitions after Gate 2]
         ⬇
         ── GATE 2: Present step defs. STOP. Wait for user confirmation. ──
         ⬇
Phase 4: Write POM (screen classes) → Dry run
[TOKEN TRACKING: pom_generation]
         ⬇
Phase 5: REAL test run on device → self-heal loop (max 3) → Hand-off
[TOKEN TRACKING: test_run → end + report + session]
```

**Hard rule:** No step-definition code until Gate 1 is confirmed. No POM until Gate 2 is
confirmed. No Gherkin until the Phase 1 reuse audit is complete.

---

## Tech Stack Defaults

Used only where Phase 1 discovery finds no existing convention (empty repo, first mobile
feature):

- **Framework**: MobileWright + `@mobilewright/test`, driven via Cucumber (BDD profile)
- **Language**: JavaScript (CommonJS — `.cjs`)
- **Pattern**: BDD with `Rule` / `Example` / `Scenario Outline`, platform tags `@android`/`@ios`
- **Fake data**: `faker.js`
- **Default paths** (only when the repo has none): `test/features/`, `test/step_definitions/`,
  `test/Pages/` — per `MOBILE_MCP_REFERENCE.md`'s documented MobileWright BDD project layout

**Whatever Phase 1 discovers in the repo overrides these defaults** — match the existing
tree's layout, naming style, and idioms exactly, same rule the web `automation` skill follows.

---

## PHASE 1 — Repo Discovery + Reuse Audit

Runs before any Gherkin is drafted.

**Card + product first:** fetch the card via Atlassian MCP now (this is the `jira_fetch`
checkpoint). `PRODUCT_FOLDER` was already derived in Phase 0d — reuse it.

Produces/refreshes the **mobile step catalog** — deliberately a separate file from the web
`automation` skill's `step-catalog.md`, since mobile Gherkin vocabulary (tap/swipe/screen)
and web vocabulary (click/fill/page) shouldn't reuse-match against each other:

```
CATALOG = .claude/skills/QE-Web-QA-Agent/product_context/{PRODUCT_FOLDER}/mobile-step-catalog.md
```

### 1a — Check catalog freshness

```bash
ls "$CATALOG" 2>/dev/null && \
  find . -path ./node_modules -prune -o \( -name '*.feature' -o -name '*.steps.cjs' -o -name '*.steps.js' \) -newer "$CATALOG" -print | head -5
```

Catalog exists and nothing newer → load it, skip to 1d. Otherwise build/refresh below.

### 1b — Discover the repo layout

MobileWright ships **two** distinct project shapes (per `MOBILE_MCP_REFERENCE.md`) — check
which one this repo actually has before assuming either:

0. Glob for `**/*.feature` and `cucumber.js`/`.cjs`/`.json` (BDD/Cucumber shape) **and**
   separately for `**/*.test.ts` under a plain `tests/`/`test/` root with no `features/`
   directory (the native shape `npm init mobilewright@latest` scaffolds). If only the native
   shape is present, this product has no Gherkin/reuse-audit surface for this skill to plug
   into yet — say so and ask once: "This repo uses MobileWright's native test format
   (`.test.ts`, no Cucumber) — set up the BDD/Cucumber profile for this feature, or add a
   plain `.test.ts` instead?" Proceed on whichever the user picks; do not silently impose BDD
   on a repo that has deliberately not adopted it.
1. Read `cucumber.js` (or `.cjs`/`.json`) and `mobilewright.config.ts`/`.js` — their globs
   and `platform`/`projects` settings tell you where features/steps/screens actually live and
   which platform(s) this product targets. A `projects` array means the real run (Phase 5)
   needs to loop once per listed platform, not assume a single device covers all of them.
2. Glob the tree for `**/*.feature`, the matched step-definition files, and Page-Object
   directories (`Pages/`, `screens/`...), excluding `node_modules`.
3. Record the observed conventions: feature path pattern, step file path pattern, screen POM
   path pattern, naming style.
4. **No test tree at all (neither shape):** tell the user, propose the BDD defaults above,
   record what they confirm.

### 1c — Build the mobile step catalog

Extract every `Given/When/Then(...)` pattern with its cucumber-expression parameters, and
every screen-POM class name + public methods.

```markdown
# Mobile Step Catalog — {PRODUCT}
Generated: {date} · Features: {n} · Step files: {n} · Steps: {n} · Screen classes: {n}
Platform(s) discovered: {ios | android | both}

## Repo Layout (discovered)
| Artifact | Path pattern | Example |
|----------|--------------|---------|

## Steps
| Pattern | Params | File | Platform tag |
|---------|--------|------|---------------|

## Screen Classes
| Class | File | Key methods |
|-------|------|-------------|
```

### 1d — Announce (one line)

> "Mobile reuse audit ready — {n} existing steps, {n} screen classes catalogued for {PRODUCT}."

Run `reuse_audit` token checkpoint.

---

## PHASE 2 — Read COS / Business Rules → Write Gherkin

**Static file load — once only, right now:** read `MOBILE_MCP_REFERENCE.md`,
`BDD_TEMPLATES.md`, and `LOCATOR_PATTERNS.md` (all in this skill's own directory). Do NOT
re-read any of them in Phase 3 or 4 — reference their rules by name only (e.g. "per Locator
Priority 1", "per the app-lifecycle step catalog").

### Step 0 — Card data check

Read `issuetype.name`:

| Card type | Action |
|-----------|--------|
| `Story` | Run full pipeline |
| `Bug` | Ask: "Do you want automation coverage, or just manual retest?" |
| `Task` | Ask: "Does this need automation or is it a config/infra task?" |

Extract: **Title**, **Description**, **Acceptance Criteria / COS**, **Comments**.

Run `jira_fetch` token checkpoint after fetch (if not already run in Phase 1).

### Step 1 — Think like a senior mobile QA engineer (internal)

Before writing any Gherkin, answer:
1. What is the **core user journey**, and does it differ meaningfully between iOS and Android?
2. What are the **happy paths**? (AC-driven)
3. What **permission dialogs, OTP screens, or deep links** does this flow touch?
4. What are the **negative scenarios**? (invalid input, denied permission, offline, backgrounded mid-flow)
5. Are there **role-based variations**?
6. Is there **dynamic data** repeating the same flow? → `Scenario Outline` candidate
7. Can any **Gherkin steps be reused** from the Phase 1 catalog (including the app-lifecycle
   step catalog in `BDD_TEMPLATES.md`)?
8. Which **screen elements** will need a `resource-id`/`accessibility-id` added?
9. Does any step need a **platform-conditional branch** (`@android`/`@ios`) per
   `LOCATOR_PATTERNS.md` §7?

Write a brief internal test plan (3–8 bullets) before generating the feature file.

### Step 2 — Generate the Feature File (reuse-matched)

Use the Gherkin format from `BDD_TEMPLATES.md`.

**Reuse matching — apply to EVERY drafted step, in strict priority order, against the
Phase 1 mobile step catalog** (identical priority logic to the web skill, applied to the
mobile-specific catalog):

| Priority | Match type | Action |
|----------|-----------|--------|
| 1 | **Exact** | Reuse verbatim. Tag internally `[reused]` |
| 2 | **Parameterized** | Reuse the existing pattern with new arguments. Tag `[reused-param]` |
| 3 | **Semantic duplicate** | Rewrite your draft to the existing wording — never a parallel step. Tag `[reused-reworded]` |
| 4 | **Genuine gap** | New step allowed. Tag `[new]` — requires approval at Gate 1 |

**Gherkin writing rules:**
- One `Rule:` per business rule / AC from the Jira card; rule text = the AC verbatim
- Use real persona names + role in `Example:` titles
- Tag `@android`/`@ios` on any Example whose interaction differs by platform (hardware BACK,
  swipe-back, permission dialog wording)
- Describe **intent and outcome**, never mechanics (`When Maria confirms the delivery address` ✅)
- Use `Scenario Outline` when 2+ scenarios share identical steps but differ only in data

### ══ GATE 1 — Gherkin + Reuse Report ══

```
Reuse report — [CARD-ID] (mobile)
  Steps total: {N} | Reused exact: {N} | Reused parameterized: {N} | New: {N}  ({X}% reuse)
  New steps requiring definitions:
    - ...
  (or: "No new step definitions needed — full reuse.")
```

**If AUTO_APPROVE = false (default):**

Present Gherkin + reuse report and ask:

> **Here is the mobile Gherkin for [CARD-ID]. Please review each Rule, Example, and the reuse report.**
>
> - Does the Rule text match the business rule / COS exactly?
> - Are platform-specific Examples (`@android`/`@ios`) tagged correctly?
> - Are the **new steps** genuinely new, or should any map to an existing step?
>
> **Type "looks good" or "confirmed" to proceed to step definitions.**

Do not write any code until confirmed. Iterate until approved. Then record the trust ratchet
— **always with `--namespace mobile`**, so this never lands in the same file the web
`automation` skill and qa-agent read (see the note at the top of this file for why that
matters):

```bash
node .claude/skills/QE-Web-QA-Agent/toolkit/qa-toolkit.cjs trust-record --product {PRODUCT_FOLDER} --namespace mobile --gate gate1 --result clean|edited
```

**If AUTO_APPROVE = true:** display the reuse report + a compact summary, proceed immediately
without waiting. Do not call `trust-record` — no human review to score.

Run `gherkin_generation` token checkpoint, then move to Phase 3.

---

## PHASE 3 — Write Step Definitions (after Gate 1)

**Do NOT reload any Phase 2 file.** Recall the rules from context.

### Step 3 — Generate Step Definitions using Mobile MCP

**Write definitions ONLY for steps tagged `[new]` at Gate 1.** Reused steps already work —
duplicating one causes cucumber-js `Ambiguous`. If every step was reused, skip to Phase 4.

For every new step that interacts with the screen, use **Mobile MCP** to:
1. Ensure the app is on the relevant screen (navigate via existing steps if needed)
2. Dump the screen via `mobile_list_elements_on_screen`
3. Check for a `resource-id`/`accessibility-id` on the target element (per
   `MOBILE_MCP_REFERENCE.md`'s detection procedure) — or note one needs to be added
4. Use the real element info to write accurate step → screen-POM method calls

**Do not guess locators.** Dump the real screen first.

Use the step definition template from `BDD_TEMPLATES.md`, including the platform-conditional
and app-lifecycle patterns where relevant.

**Step definition rules:**
- CommonJS only — `require()`/`module.exports`
- Use `{word}` for persona capture, `{string}` for quoted data values
- No business logic in step files — all logic lives in the screen POM
- No direct `screen.getByX()` calls in step files — always go through POM methods
- Step pattern must match the `.feature` file exactly, character for character
- Any step whose behavior differs by platform must branch on `this.platform`, resolved once
  in a `Before` hook (see template) — never re-detect platform mid-step

### ══ GATE 2 ══

**If AUTO_APPROVE = false:**

> **Here are the step definitions for [CARD-ID]. Please review.**
>
> - Do the step patterns match the Gherkin exactly?
> - Are platform-conditional branches correct for both `@android` and `@ios`?
> - Any lifecycle/permission-dialog steps to add or remove?
>
> **Type "looks good" or "confirmed" to proceed to the screen POM.**

```bash
node .claude/skills/QE-Web-QA-Agent/toolkit/qa-toolkit.cjs trust-record --product {PRODUCT_FOLDER} --namespace mobile --gate gate2 --result clean|edited
```

**If AUTO_APPROVE = true:** display a compact summary, proceed immediately. No `trust-record`.

Run `step_definitions` token checkpoint, then move to Phase 4.

---

## PHASE 4 — Write Screen POM → Dry Run

**Do NOT reload any file.** Recall `BDD_TEMPLATES.md`/`LOCATOR_PATTERNS.md` rules from context.

### Step 4 — Generate the Screen POM using Mobile MCP

**Reuse check first:** consult the catalog's Screen Classes table. Extend an existing class
rather than creating a parallel one.

**Locator memory check — once per screen, before opening Mobile MCP for it.** Prefix the
`--page` key with `mobile:` so it never collides with a web page URL recorded for the same
product folder:
```bash
node .claude/skills/QE-Web-QA-Agent/toolkit/qa-toolkit.cjs locator-query --product {PRODUCT_FOLDER} --page "mobile:{ScreenName}"
```
`NONE` → nothing learned yet, proceed as usual. Rows returned → avoid the recorded **Failed
Locator** even if it looks obvious; prefer the recorded **Working Locator** if the element matches.

**Screen fingerprint check — once per distinct screen this run.** Reuses the generic
`fingerprint`/`get-selectors` toolkit commands (they only take opaque strings — no change
needed to the toolkit itself) with a synthetic mobile identifier as the `--url`:
```
mobile_list_elements_on_screen()   # extract resource-id/accessibility-id values, comma-join
```
```bash
node .claude/skills/QE-Web-QA-Agent/toolkit/qa-toolkit.cjs fingerprint --product {PRODUCT_FOLDER} --url "mobile:{bundleId}/{ScreenName}" --testids "RESULT_FROM_ABOVE"
node .claude/skills/QE-Web-QA-Agent/toolkit/qa-toolkit.cjs get-selectors --product {PRODUCT_FOLDER} --url "mobile:{bundleId}/{ScreenName}"
```
`UNCHANGED` + `get-selectors` covers the needed elements → write POM locators straight from
those rows, skip the per-element dump below. Otherwise fall through to full inspection.

For every locator not already resolved above:
1. Ensure the app is on the target screen
2. `mobile_list_elements_on_screen()` and inspect the target element
3. Check for `resource-id`/`accessibility-id` (check both fields — see `LOCATOR_PATTERNS.md` §1)
   - Present → `screen.getByTestId('...')` with the real value
   - Absent → ask for one to be added to source if feasible, then fall through the Locator
     Priority table in `LOCATOR_PATTERNS.md`
4. Never write a coordinate fallback and move on without documenting why no better locator existed

**POM rules:**
- All locators defined in `constructor`, never inside methods
- All actions `async`, single-purpose
- Assertions in separate methods prefixed `verify`
- No hardcoded waits — use `expect(...).toBeVisible()`/`toBeEnabled()`

Run `pom_generation` token checkpoint after the POM is written.

### Step 5 — Dry Run Validation

```bash
npm run test:dry
```
(or `npx cucumber-js --dry-run` if the repo's discovered config uses plain Cucumber rather
than MobileWright's BDD wrapper script)

- ✅ All steps defined → proceed
- ❌ `Undefined` → fix step pattern to match Gherkin exactly, re-run
- ❌ `Ambiguous` → reuse-audit miss — reuse the existing step, don't rename
- ❌ `require` errors → fix paths, re-run

Fix and re-run automatically. Do not proceed until clean.

---

## PHASE 5 — Real Test Run on Device + Self-Heal → Hand-off

A dry run only proves patterns match. QA means the test actually passes against a real
device/simulator/emulator.

### Step 6 — Execute the new feature

Requires the device + app resolved in Phase 0. If unavailable, skip with an explicit warning
in the hand-off: "Real run SKIPPED — no device available."

**Platform targeting and scenario tag filtering are two different things — don't conflate
them.** The device/platform is already fixed by whichever one Phase 0 connected to (or by the
`PLATFORM` env var the repo's own `test:android`/`test:ios` npm scripts set, if those are
what Phase 1b discovered). `--tags` only selects *which scenarios* cucumber picks up within
that run — it does not target a device.

```bash
# Single platform (the common case — one device was resolved in Phase 0):
npx cucumber-js <new feature file> --tags "@android or not @ios"   # drop platform-exclusive
                                                                     # tags for the platform NOT running
```

**If Phase 1b found a `projects` matrix covering multiple platforms**, run the suite once per
listed platform (looping, not a single command) — each with its own device from Phase 0 and
its own tag filter for that platform's Examples:

```bash
PLATFORM=android npm run test:android -- <new feature file>
PLATFORM=ios     npm run test:ios     -- <new feature file>
```

Report each platform's result separately in the hand-off (Step 8) — do not average or merge
a pass on one platform with a fail on the other into a single PASSED/FAILED line.

### Step 6b — Self-heal loop (max 3 attempts)

1. Read the failure: locator timeout? permission dialog blocking? assertion mismatch?
   platform-conditional branch missing? crash?
2. **Locator failures** → re-inspect via `mobile_list_elements_on_screen`, fix the POM
   locator (respect Locator Priority). Once fixed, persist it so no future run repeats the
   same wrong guess — locator strings can contain quotes; write a JSON file first:
   ```
   Write outputs/.mobile-locator-tmp.json containing:
   {"product": "{PRODUCT_FOLDER}", "page": "mobile:{ScreenName}", "element": "ELEMENT_LABEL",
    "failed": "OLD_LOCATOR", "fixed": "NEW_LOCATOR", "reason": "ONE_LINE_WHY", "card": "{CARD_ID}"}
   ```
   ```bash
   node .claude/skills/QE-Web-QA-Agent/toolkit/qa-toolkit.cjs locator-record --file outputs/.mobile-locator-tmp.json
   ```
3. **Permission dialog / OS interruption** → not a locator bug (per `LOCATOR_PATTERNS.md` §3)
   — add the dialog-handling step from `BDD_TEMPLATES.md` before the step that triggers it,
   don't touch the target element's locator.
4. **Assertion failures where the app itself looks wrong** → check whether an app crash
   coincided with the failure:
   ```
   mobile_list_crashes()
   mobile_get_crash(crashId)   # if one matches the failure's timestamp
   ```
   If the app appears genuinely wrong (or crashed), this is a **bug, not a test fix** — stop
   healing that scenario, mark it failing, note it (with the crash report if found) as a bug
   candidate in the hand-off.
5. Re-run. After 3 failed attempts, stop and report the failure honestly.

Run `test_run` token checkpoint, then `end + report + session` close-out.

### Step 7 — Update the mobile step catalog

Append every new step definition and any new/extended screen class to the Phase 1 catalog.

### Step 8 — Hand-off Summary

```
✅ Mobile automation agent complete for <CARD-ID>

Platform(s) run:  <ios | android | both>
Feature file:     <path per discovered repo layout>
Steps file:       <path, or "none — full reuse">
Screen POM file:  <path, or "extended existing: <class>">

Scenarios covered:
  - <Rule 1>: <n> Example(s), <n> Outline(s)

Reuse:  {N} steps total | {N} exact | {N} parameterized | {N} new  ({X}% reuse)
resource-id / accessibility-id added to source: <element list or "none required">
Dry-run:  PASSED
Test run:
  Android: {PASSED | FAILED after 3 heal attempts: <reason> | SKIPPED — no device available | N/A — not in project matrix}
  iOS:     {PASSED | FAILED after 3 heal attempts: <reason> | SKIPPED — no device available | N/A — not in project matrix}
Bug candidates from test run: <list, with crash report reference if applicable, or "none">

Ready for: bug-reporting agent
```

### Post Hand-off — Write Product Context

Unlike the web `automation` skill (which can skip context-file creation because qa-agent's
Step 6 reliably creates it afterward), **this skill has no orchestrator that ever runs after
it** — it's always standalone. If it also skipped creating the file, a product's first mobile
run would leave no persisted context at all. So: create the file here if missing, don't just
skip.

```
CONTEXT_FILE = .claude/skills/QE-Web-QA-Agent/product_context/{PRODUCT_FOLDER}/context.md
```

**If context file exists — append to its tables (Edit tool, never overwrite existing rows):**
- `Runs Log`: date | `{CARD_ID}` | `Automation` (per `CONTEXT_SCHEMA.md`'s fixed Manual/
  Automation/Both values — don't invent a fourth) | outcome | bugs filed (candidates from
  Step 6b, or "—") | reuse % | one-line note starting `"mobile (ios/android): "` so it's
  distinguishable from a web automation run in the same log
- `Element Selectors`: `[mobile] {Element Label}` | `mobile:{bundleId}/{ScreenName}` | Locator | Method | resource-id/accessibility-id value or "none" | Card ID
- `Covered Flows`: Rule text | Example count | Card ID | date

**If context file does not exist — create it now**, using
`.claude/skills/QE-Web-QA-Agent/product_context/CONTEXT_SCHEMA.md` as the template (same schema
qa-agent Step 6c uses for the web pipeline — this is the same file, not a mobile-specific
variant). Fill in: Jira project key, product name, environment (from the resolved platform/
device, not a URL), auth method (if the flow under test logs in), OTP required (yes/no only).
Never write credentials — those stay in `.env`. Then write the same `Runs Log` /
`Element Selectors` / `Covered Flows` rows described above as the file's first entries.

One-line confirmation either way:
```
Mobile context saved → .claude/skills/QE-Web-QA-Agent/product_context/{PRODUCT_FOLDER}/context.md ({N} elements, {N} flows).
```
