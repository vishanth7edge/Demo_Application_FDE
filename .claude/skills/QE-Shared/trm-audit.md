---
name: trm-audit
description: >
  Audits an existing Playwright + CucumberJS + BDD automation repo against the three-layer
  Test Reuse Metrics (TRM) framework — POM Inheritance %, Step Reuse %, Feature:Step Ratio —
  and produces a concrete, file-and-line-level alignment report: what violates the framework,
  what to move where, and a migration plan ordered by impact. Report-only by default; only
  applies a fix (e.g. creating/extending the master switch step file) if the user explicitly
  asks after seeing the report. Repo-agnostic — discovers the pages/step-definitions/features
  directories at runtime rather than assuming folder names.
  MANUAL INVOCATION ONLY — do NOT trigger this skill from a plain-English request ("audit our
  tests", "check reuse", "how's our automation reuse looking"), no matter how closely it
  matches this skill's purpose. Only invoke it when the user explicitly runs the `/trm-audit`
  slash command. If a message sounds like it wants this skill but didn't use the command, tell
  the user to run `/trm-audit` instead of invoking it yourself.
user-invocable: true
---

> **Note:** No longer an independently-triggered Claude Code skill and no longer has its own slash command. It's read and executed by `/web-qa-agent` or `/mobile-qa-agent` when the user picks **trm-audit** from its menu — the full procedure below still applies exactly as written.

# TRM Alignment Auditor

Reads an existing BDD automation repo end to end — every page class, every step definition,
every feature file — and reports exactly where it violates the three-layer TRM framework, at
file-and-line granularity, with a migration plan ordered by impact. This skill is
**repo-agnostic**: discover folder names and conventions at runtime (Step 0), never assume them.

## Relationship to other qa-pack skills

TRM is a specific, opinionated architecture — a **keyword-driven dispatcher** style where most
Gherkin routes through a handful of generic `{string}`-parameterized "master switch" steps.
That is a different reuse strategy from the `automation`/`mobile-automation` skills in this
pack, which generate one clearly-worded step per business-rule `Rule:`/`Example:` and reuse via
exact/parameterized/reworded matching against a step catalog — no page-name dispatcher. Both are
legitimate reuse strategies; **this skill audits a repo against its own stated TRM
architecture, it does not import qa-pack's own Gherkin conventions into the audit.** Don't
flag a repo for not using `automation`'s reuse-audit style — that's not what TRM measures.

## Static file load — once, at skill start

Read `.claude/skills/QE-Shared/TRM_FRAMEWORK.md` now — it holds the full Layer 1/2/3 rule
definitions, violation examples, the master-switch file template, and the "always enforce"
rule list. Do not reload it later in this run; reference its sections by number (e.g. "per §1
shared method rule", "per §5 rule 8") for the rest of the audit.

## The measurement script — why Step 1 doesn't read files itself

`measure-reuse.cjs` (in this skill's own directory) does the full Layer 1/2/3 scan
deterministically: parsing every page class, step definition, and feature file, and emitting
file-and-line violations matching `TRM_FRAMEWORK.md` — same philosophy as
`qa-toolkit.cjs` (see `SKILLS_CONTEXT.md` → "The Toolkit"): this is pure computation, and
routing it through the model (read every file → reason over it) burns tokens on work a script
does deterministically and faster. **Step 1 below is running this script once and reading its
JSON output — it does not re-open the pages/step-definitions/feature files itself.**

Pass the paths discovered in Step 0 to it explicitly (see Step 1's command) — don't rely on
the script's own built-in auto-discovery fallback once Step 0 has already found the real
answer; the flags exist so the LLM's discovery (which can read `cucumber.js`/config context
the script doesn't parse) always wins over the script's simpler heuristics.

**Heuristic caveat — the script isn't a full AST parser.** Regex-based detection of things
like `sharedMethodCandidate` (same method name in 2+ page classes — flagged by name only, not
a deep body diff), `genericMethodInPageClass`, `technicalDetail`, and `hardcodedData` can
produce a false positive on unusual formatting. Spot-check the report's top few violations
per category against the actual file before finalizing — don't blindly transcribe every JSON
entry as gospel, especially `sharedMethodCandidate` entries, since "same method name" doesn't
always mean "same implementation."

If the script errors (e.g. a repo shape it can't parse) or a repo is unusually exotic, fall
back to direct reads for just the affected files/dirs — never node_modules/dist/build/coverage*,
and for a large fallback scope (~40+ files) delegate per-directory reading to one
`Explore`/general-purpose subagent per directory rather than pulling everything into the main
context.

---

## Step 0 — Discover the project

Detect these facts by inspection; do not hardcode any path.

1. **Config file check first**: look for `scripts/measure-reuse.cjs` in the target repo. If it
   exists and defines path config, read paths from there instead of inferring.
2. **Otherwise, infer from common patterns** — check each of these in order and use the first
   that exists (repos in this ecosystem sometimes keep a typo like `step-definations/` —
   preserve whatever the repo actually uses, don't "fix" it):
   ```bash
   ls -d test/Pages test/pages Pages pages 2>/dev/null
   ls -d test/step-definitions test/step-definations step-definitions step-definations 2>/dev/null
   ls -d test/features features 2>/dev/null
   git ls-files '*.feature' | sed 's#/[^/]*$##' | sort -u | head   # confirms the real features root
   ```
3. **BasePage location**: find the file defining `class BasePage` (usually alongside or one
   level above the pages directory) — `grep -rl "class BasePage" --include="*.cjs" --include="*.js"`.
4. **Master switch file**: look for `commonSteps.cjs` or equivalent under the step-definitions
   directory — `grep -rl "switch" <step-defs-dir> --include="*.cjs" --include="*.js"` narrowed
   to files containing 2+ of the five patterns from `TRM_FRAMEWORK.md` §2.

If none of `pages`, `step-definitions`, or `features` directories can be found at all, tell
the user this skill targets Playwright + CucumberJS + BDD repos and stop — do not guess at a
framework this repo doesn't use.

Keep the resolved values as `PAGES_DIR`, `STEPS_DIR`, `FEATURES_DIR` (parent of the
`**/*.feature` glob), `BASE_PAGE_FILE` — Step 1 passes them straight to the script.

**Trend baseline, before running the script**: the script overwrites
`outputs/trm/reuse-report.json` on every run, so if a prior report already exists, read its
`gherkin.summary.featureToStepRatio` now and hold onto it — that's the only thing from a prior
run worth preserving, and it must be captured before Step 1 overwrites the file.

---

## Step 1 — Run the measurement script (Layers 1–3)

```bash
node .claude/skills/QE-Shared/measure-reuse.cjs \
  --pages-dir "$PAGES_DIR" --steps-dir "$STEPS_DIR" --features-glob "$FEATURES_DIR/**/*.feature" \
  --base-page-file "$BASE_PAGE_FILE"
```

Read `outputs/trm/reuse-report.json`. Its shape maps directly onto the report sections below:

| JSON path | Report section |
|---|---|
| `pom.summary`, `pom.violations` | CURRENT STATE Layer 1 line + LAYER 1 VIOLATIONS block |
| `steps.summary`, `steps.singleUseSteps.{navigation,dataEntry,button,toastAssertion,confirmation,unclassified}` | CURRENT STATE Layer 2 line + LAYER 2 VIOLATIONS buckets |
| `steps.masterSwitch.{found,files,byPattern,missingPatterns}` | LAYER 2 → MASTER SWITCH FILE STATUS |
| `gherkin.summary`, `gherkin.violations` (types: `scenarioKeyword`/`technicalDetail`/`hardcodedData`) | CURRENT STATE Layer 3 line + LAYER 3 VIOLATIONS block |

Compare `gherkin.summary.featureToStepRatio` against the baseline captured in Step 0 (if any)
to report improving/regressing/first-run.

Status bands (Layer 1/2, from `pom.summary.verdict`/`steps.summary.verdict` — already computed
by the script, don't recompute): GOOD / MODERATE / NEEDS WORK.

Per the heuristic caveat above, spot-check the highest-count violation category and every
`sharedMethodCandidate` entry against the real file before writing them into the report.

---

## Step 2 — Output the report

The report IS the deliverable, same rule as `impacted-tests`:
1. FIRST save it to `outputs/trm-alignment-report.md` with the Write tool (create `outputs/`
   if needed) so it survives the session.
2. THEN print it as the **final text message of the turn** — no tool calls after it, printed
   exactly once.

Exact format:

```
═══════════════════════════════════════════════════════
  TEST REUSE METRICS — ALIGNMENT REPORT
═══════════════════════════════════════════════════════

CURRENT STATE
─────────────
  Layer 1 — POM Inheritance:    __% (__/__ pages)   [GOOD / MODERATE / NEEDS WORK]
  Layer 2 — Step Reuse:         __%                  [GOOD / MODERATE / NEEDS WORK]
  Layer 3 — Feature:Step Ratio: __:1                 [TRACKING]

═══════════════════════════════════════════════════════
  LAYER 1 VIOLATIONS — Page Object Model
═══════════════════════════════════════════════════════

[If violations found, one block per violation:]
  ✗ FILE: pages/Auth/LoginPage.cjs
    ISSUE: Class does not extend BasePage
    FIX:   Change `class LoginPage {` to `class LoginPage extends BasePage {`

  ✗ FILE: pages/Dashboard/DashboardPage.cjs — line 12
    ISSUE: Generic navigation method belongs in BasePage
    METHOD: async goToPage(url) { await this.page.goto(url); }
    FIX:   Remove this method. Use `this.navigateTo(path)` inherited from BasePage instead.

[If no violations:]
  ✓ All page classes extend BasePage. Layer 1 is healthy.

═══════════════════════════════════════════════════════
  LAYER 2 VIOLATIONS — Step Definition Reuse
═══════════════════════════════════════════════════════

  SINGLE-USE STEPS FOUND: __ of __ total step definitions

  HIGH IMPACT — Navigation steps to consolidate (__ found):
  ─────────────────────────────────────────────────────────
  These steps should become cases in: Given('John is in the {string} page', ...)

    FILE: step-definitions/Auth/loginSteps.cjs — line 4
    STEP: Given('John is on the login page', ...)
    ACTION: Add case 'login' to navigation master switch

  [repeat per bucket: Data entry / Button / Toast assertion / Confirmation]

  MASTER SWITCH FILE STATUS (per pattern — a repo may split these across files):
    [EXISTS] Navigation      → step-definitions/navigationSteps.cjs (cases: login, dashboard)
    [EXISTS] Toast assertion → step-definitions/Common/commonSteps.cjs (no switch — single step, no cases to list)
    [MISSING] Data entry, Button, Confirmation — no existing pattern found anywhere;
              add to step-definitions/Common/commonSteps.cjs (or wherever the EXISTS rows
              above already live, if consolidating into one file is preferred) — see template
              in TRM_FRAMEWORK.md §4

═══════════════════════════════════════════════════════
  LAYER 3 VIOLATIONS — Gherkin Format
═══════════════════════════════════════════════════════

  KEYWORD VIOLATIONS (__ found):
    FILE: features/Auth/login.feature — line 5
    ISSUE: Uses 'Scenario:' keyword
    FIX:   Replace with 'Rule:' + 'Example:'

  TECHNICAL DETAIL VIOLATIONS (__ found):
    FILE: features/Auth/login.feature — line 9
    ISSUE: Step contains technical detail: 'clicks the button with id="submit-btn"'
    FIX:   Replace with: When John submits with the "login" button

  HARDCODED DATA VIOLATIONS (__ found):
    FILE: features/Auth/login.feature — line 12
    ISSUE: Hardcoded email in step: 'enters "john@test.com" into the email field'
    FIX:   Replace with: When John enters the "login credentials"

═══════════════════════════════════════════════════════
  MIGRATION PLAN — Ordered by Impact
═══════════════════════════════════════════════════════

  STEP 1 — Create/update commonSteps.cjs master switch file [HIGH IMPACT]
    Expected improvement: Step Reuse % +40–50 percentage points

  STEP 2 — Migrate all navigation single-use steps [__ steps]
    Files to update: [list files]
    Action: Delete step definitions, add cases to navigation switch

  STEP 3 — Migrate all data entry single-use steps [__ steps]
  STEP 4 — Migrate all button single-use steps [__ steps]
  STEP 5 — Migrate all toast assertion single-use steps [__ steps]
  STEP 6 — Fix Gherkin keyword violations [__ files]
  STEP 7 — Fix technical detail / hardcoded data violations in Gherkin [__ files]

═══════════════════════════════════════════════════════
  PROJECTED STATE AFTER MIGRATION
═══════════════════════════════════════════════════════

  Layer 1 — POM Inheritance:    100%         [GOOD]
  Layer 2 — Step Reuse:         ~70–80%+     [GOOD]
  Layer 3 — Feature:Step Ratio: trending up  [TRACKING]
  Total step definitions:       ~50–80 master steps (down from __)
```

Rules for filling it in:
- Every violation entry cites a real file path and, where meaningful, a real line number —
  never a placeholder in the actual output (the `__` above are template markers only).
- Group Layer 2 violations by action-type bucket, highest-count bucket first, so "impact" in
  the migration plan is visibly grounded in real counts, not asserted.
- If a bucket has zero violations, omit that bucket's block entirely rather than printing "0 found".
- The migration plan's STEP ordering always puts the master-switch file (create/extend) first
  — every other step depends on it existing.

---

## Step 3 — Offer to execute

After printing the report, ask once:

> "Want me to apply any of these? I can create/extend `commonSteps.cjs` and update the
> Gherkin files that reference the old single-use steps. (yes / no / just the master switch file)"

**If the user declines** — stop. The report is the deliverable, same as `impacted-tests`.

**If the user accepts (fully or partially):**
1. Master switch file(s) first, per pattern (check `steps.masterSwitch.byPattern` from Step 1's
   JSON before deciding create vs extend — a repo may already have some patterns and be
   missing others, possibly split across files):
   - Pattern already in `byPattern` → **extend that file**, add new `case` entries to its
     existing switch.
   - Pattern in `missingPatterns` → add it to whichever existing master-switch file makes
     sense to consolidate into (prefer one of the files already in `steps.masterSwitch.files`
     over creating a new one), or create `commonSteps.cjs` fresh only if `masterSwitch.found`
     is `false` entirely (per `TRM_FRAMEWORK.md` §4 template).
   - Every `case` value comes from `steps.singleUseSteps` in Step 1's JSON — never ship
     placeholder cases.
2. For each single-use step being migrated: before deleting its old step-definition, grep
   every feature file for that exact step text to confirm zero remaining references once the
   Gherkin is updated — **never delete a step definition while any feature file still
   references its exact text**, that breaks the suite instead of improving it. Update the
   Gherkin line(s) to the master-step form in the same pass as removing the old step def, not
   as two separate uncoordinated edits.
3. Apply Gherkin format fixes (`Scenario:`→`Rule:`/`Example:`, technical-detail removal,
   hardcoded-data-to-parameter) file by file, per `gherkin.violations` in the JSON.
4. After applying, re-run Step 1's script invocation to recompute the metrics from scratch and
   show a short before/after delta (not a full re-print of the report) — e.g. "Layer 2: 32% → 71%."

Never apply a migration step the user didn't ask for, and never touch a file outside the
pages/step-definitions/features directories discovered in Step 0.

Generation this step performs (writing corrected `commonSteps.cjs` cases, updated Gherkin,
consolidated `BasePage` methods) is judgment-driven — the script only detects and classifies,
it never rewrites source. That split is intentional: computation stays in the script,
decisions stay with you.
