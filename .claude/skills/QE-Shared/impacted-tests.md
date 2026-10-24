---
name: impacted-tests
description: After pulling a developer branch into a test branch, analyze ONLY the src changes that pull brought in and map them to the BDD/Cucumber test files (feature files, step definitions, page objects) they can break, then print a report. Report-only - it never runs tests; the QA opens and runs the listed files manually. Repo-agnostic - it auto-discovers the test folder, framework, and diff base at runtime. Use when the user asks "which tests are impacted by this pull" or "map dev changes to tests". Usage - /impacted-tests [base-branch-or-commit] [changed file paths...]
---

> **Note:** No longer an independently-triggered Claude Code skill and no longer has its own slash command. It's read and executed by `/web-qa-agent` or `/mobile-qa-agent` when the user picks **impacted-tests** from its menu — the full procedure below still applies exactly as written.

# Impacted Tests Analyzer

Map the source-code changes a developer-branch pull brought in to the BDD test files they can break, so QA can review/run those tests locally before CI. This skill is **repo-agnostic**: it discovers everything about the project at runtime. Do NOT assume any specific folder names, framework version, or paths — always run Step 0 first.

## Token-efficiency rules (mandatory)

- Work from the **diff**, never by reading whole source files. `git diff --name-only` / `-U0` gives everything needed.
- Map with `grep -rl` / `grep -rn` (filenames + line numbers only); never `cat` a feature/step/page file in full. Read at most ±10 lines around a hit, and only when a mapping is ambiguous.
- Batch all greps for one identifier list into a single command with `-E "id1|id2|..."`.
- Never search `node_modules`, `dist`, `build`, `coverage*`, or other generated/vendor dirs.
- If the diff spans more than ~30 src files, delegate the mapping (Step 3) to one `Explore` subagent (breadth: medium) with the identifier list; ask it to return only file paths + one-line reasons.

## Step 0 — Discover the project (do this first, every run)

Detect these facts by inspection; keep the results in mind for later steps. Do NOT hardcode.

1. **Test root**: the folder holding BDD tests. Find it, don't assume:
   ```bash
   ls -d test tests e2e cypress 2>/dev/null
   git ls-files '*.feature' | sed 's#/[^/]*$##' | sort -u | head
   ```
   The common ancestor of the `*.feature` files is the test root. Feature files, step definitions, and page objects all live under it (subfolder names vary per repo — discover them, e.g. `git ls-files "$TEST_ROOT/**" | sed 's#[^/]*$##' | sort -u`).
2. **Framework + run command**: read `package.json` scripts and any cucumber config (`cucumber.js`, `cucumber.cjs`, `cucumber.json`, `.cucumberrc*`). Derive the single-feature run command from the test script or CI script rather than inventing one. If none is discoverable, fall back to `npx cucumber-js <feature-path>`. (This is only for the manual-run footer in the report — the skill never runs anything itself.)
3. **Source root**: the app code the tests exercise — usually `src/`, else the top-level dir(s) that are neither the test root nor config/vendor. Confirm with `git ls-files | grep -vE "^($TEST_ROOT|node_modules|dist)" | ...`.

If there are no `*.feature` files anywhere, tell the user this skill targets BDD/Cucumber repos and stop.

## Step 1 — Collect the diff from the most recent pull INTO the current branch

The input is exactly what the last pull brought into **this** branch — no need to know or name the developer branch. When you `git pull` (or merge) another branch into your current branch, git records a merge commit whose second parent is the pulled tip; `$MERGE^1..$MERGE` is precisely "what that pull added on top of my branch". That is the primary and preferred signal:

```bash
# Primary: the most recent merge commit on the CURRENT branch = the most recent pull into it
MERGE=$(git log --merges -1 --format=%H)
git log -1 --format='%s  (merged in: %p)' $MERGE   # sanity check — this is the pull you just did
git diff --name-status $MERGE^1 $MERGE -- <SRC_ROOT>
DIFF_RANGE="$MERGE^1 $MERGE"
```
Fallbacks, in order (only if there is no merge commit — e.g. a fast-forward pull, or you pulled before creating any commit):
- User passed a base ref/commit as the first argument: `git diff --name-status <arg>...HEAD -- <SRC_ROOT>` — use this whenever the auto-detected pull is wrong.
- Otherwise diff against the current branch's upstream/tracking ref if set (`@{u}`), else against whichever of `origin/develop-temp`, `origin/develop`, `origin/main`, `origin/master` exists: `git diff --name-status HEAD...<ref> -- <SRC_ROOT>`.
- User passed explicit file paths or a pasted diff: use those directly.

If the src diff is empty everywhere, tell the user no pulled source changes were found (ask when they last pulled, or to pass the base ref explicitly) and stop — do NOT fall back to analyzing their own test edits.

Scope: only files under `<SRC_ROOT>` are analysis input. Ignore unit-test files in the diff (`*.test.*`, `*.spec.*`, `__tests__/`) — they are not BDD-flow relevant. The QA's own changed test files are NOT impact findings (mention them, if at all, in one closing line).

## Step 2 — Extract impact identifiers (from the diff only)

Build a small identifier list without opening files (use `$DIFF_RANGE` from Step 1):

```bash
git diff -U0 $DIFF_RANGE -- <SRC_ROOT> | grep -oE 'data-testid="[^"]+"' | sort -u                      # changed testids
git diff -U0 $DIFF_RANGE -- <SRC_ROOT> | grep -E '^[+-]' | grep -oE '"[A-Z][A-Za-z0-9 /&-]{3,40}"' | sort -u  # added/removed UI strings
```
Identifiers = (a) changed `data-testid`/locator attribute values, (b) component/page basenames from the changed file paths, (c) route/path strings in the diff, (d) user-facing label/heading/button/message strings added or removed. `data-testid` and UI strings are the strongest signals; include **removed** ones too — a deleted locator is exactly what breaks a test.

## Step 3 — Map identifiers to test files, then down to scenarios

Chain cheapest-first, filenames only, all under the discovered `<TEST_ROOT>`:

1. **Filename match**: identifier keywords vs feature/step filenames (`git ls-files "$TEST_ROOT/**/*.feature" "$TEST_ROOT/**/*.[jt]s" | grep -iE "kw1|kw2"`).
2. **Content match**: `grep -rilE "id1|id2|LabelText" "$TEST_ROOT" --include="*.feature" --include="*.js" --include="*.ts"`.
3. **Close the chain**: for a hit in a step-definition or page-object that has no same-named feature, grep its distinctive step text into the feature files to find the owning feature(s).
4. **Resolve to scenarios**: for each impacted feature file, `grep -nE "Scenario:|Example:|Rule:|<step text>" <feature>` to get the affected scenario title(s) and line number(s). The report cites the **feature file + scenario + line**, because testers navigate by scenario, not by step-definition code.

Risk level (two only): 🔴 **Will fail** = a locator/step the test uses was removed or renamed; 🟡 **At risk** = shares a changed screen/component/steps but locators likely survive.

## Step 4 — Output the report

The report IS the deliverable. In this exact order:

1. FIRST save it to `outputs/impacted-tests-report.md` with the Write tool (create `outputs/` if needed) so it survives the session.
2. THEN print it as the **final text message of the turn** — no tool calls after it, printed exactly ONCE, beginning with `## Impacted tests report`. Never print it before a tool call and repeat it after.

Format (per-line, not a table — tables wrap badly in terminals):

```
## Impacted tests report

Analyzed <N> source files pulled from <ref> (merge <shorthash>).

**Impacted test files (<N>) — highest risk first:**

1. 🔴 <TEST_ROOT>/path/to/Some.feature
   **Will fail** — Example: "<scenario title>" (<TEST_ROOT>/path/to/Some.feature:34) — <one sentence, in tester/UI terms, of what the developer changed>.

2. 🟡 <TEST_ROOT>/path/to/Another.feature
   At risk — Rule: "<rule title>" (<TEST_ROOT>/path/to/Another.feature:41) — <one sentence>.

**Coverage gaps (no test exercises these yet):**
- <new dev functionality with no scenario> — needs a new scenario.

**To run any of these manually** (start your app first):
<discovered single-feature run command> <feature-path>
```

Rules for each entry:
- Risk marker first, then ONE sentence citing the affected scenario by its `Scenario:`/`Example:`/`Rule:` title with a clickable `feature-path:line`, describing the change in **UI/tester terms** ("the dropdown was replaced with an input + Verify button").
- Do NOT reference step-definition filenames, page objects, or source component filenames in the reasons — testers read feature files, not code. Source filenames may appear only in the coverage-gaps section when there is no feature to point to.
- **Hyperlink rule**: write feature paths as bare repo-relative paths in plain text (with `:line`) — NOT as `[label](path)` markdown links. Terminals auto-detect plain paths and make them ctrl+clickable; a markdown label hides the path and breaks that.
- No confidence column, no per-source-file table, no separate flat path list — the numbered paths ARE the list.

## Step 5 — Stop

The report is the deliverable. Do NOT run any test, do NOT ask whether to run them — the QA reviews the report and runs files manually using the footer command. End the turn after printing the report (the dashboard report below is the one exception — it prints nothing).
