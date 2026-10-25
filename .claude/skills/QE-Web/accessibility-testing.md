---
name: accessibility-testing
description: >
  Tests a live web page against WCAG 2.1 Level A and AA criteria. Injects axe-core via
  browser_evaluate for automated rule checks, then runs manual keyboard, focus, skip-link,
  heading, and alt-text checks via Playwright MCP. Accepts a full page URL, logs in with
  Playwright MCP (credentials/OTP from .env), navigates to the target page, runs all checks, saves
  a structured report to outputs/, and — after confirmation — logs violations as one
  comment on the provided card (never a separate Jira issue).
  Uses Playwright CLI for zero-token screenshots. Token tracking enabled.
  Standalone or callable from qa-agent.
  Trigger: "accessibility test", "a11y test", "run accessibility", "check WCAG",
  "accessibility [URL]", "a11y [JIRA-KEY]", "test accessibility for [page]",
  or "check accessibility".
compatibility: >
  Playwright MCP must be running. axe-core injected at runtime from CDN — no install needed.
  OTP code from .env QA_OTP_CODE. Playwright CLI (npx playwright) must be available.
user-invocable: true
---

> **Note:** No longer an independently-triggered Claude Code skill. It's read and executed by `/web-qa-agent` when the user picks **accessibility-testing** from its menu — the full procedure below still applies exactly as written.

# Accessibility Testing Skill — WCAG 2.1 Level A/AA

## Token Budget Rules — enforce throughout this skill

| Operation | USE | NEVER USE |
|-----------|-----|-----------|
| Page screenshots | `npx playwright screenshot --full-page URL file.png` | `browser_screenshot()` |
| DOM reading | `browser_evaluate` with targeted JS only | `browser_snapshot()` |
| Login form selectors | `browser_snapshot()` — **one time only** at login screen | Any other snapshot |
| axe-core checks | `browser_evaluate` injection + run | External a11y CLI tools |

## Token Tracking

Optional and silent — follow the **Token Tracking** pattern in `SKILLS_CONTEXT.md`
(run its enablement check once at skill start; if disabled, skip every checkpoint silently).
Checkpoints: `start` → `login` → `a11y_checks` → `end + report + session`.
Use `CARD_ID` if Jira card provided, else `"a11y-test"`. Never show tracking output to user.

---

## Pipeline

```
Full Page URL (input)
        ↓
[Step 0] Collect Inputs — URL, credentials, Jira card
        ↓
[Step 1] Login via Playwright MCP (skip if session active)
        ↓
[Step 2] Navigate to Target Page + Baseline Screenshot
        ↓
[Step 3] axe-Core Automated Checks (WCAG 2.1 A + AA)
        ↓
[Step 4] Manual Checks — keyboard, focus, skip link, headings, alt text
        ↓
[Step 5] Generate + Save Report → outputs/a11y-report-[slug]-[date].html
        ↓
[Step 6] File Jira Bugs (critical/serious → individual bugs; moderate/minor → comment)
```

---

## Step 0 — Collect Inputs

Run token tracking `start` checkpoint.

Ask questions **one at a time**. Wait for each answer before asking the next.

**Question 1 — Page URL:**
> "Please paste the **full URL of the page** you want to accessibility-test.
> (e.g. `https://app.example.com/dashboard/settings`)"

Store as `TARGET_URL`.
Extract `BASE_URL` = scheme + host (e.g. `https://app.example.com`).
Extract `URL_SLUG` = last 2 meaningful path segments, lowercase, hyphens, strip UUIDs.

**Question 2 — Jira Card:**
> "Do you have a **Jira card ID** to file bugs against? (e.g. `QA-123`)
> Type `skip` to only generate the report."

- If provided: store `JIRA_CARD_ID`, set `FILE_JIRA = true`
- If skipped: set `FILE_JIRA = false`

**Question 3 — Check if login is needed:**

`browser_navigate(url: BASE_URL)` then `browser_wait_for(state: "networkidle")`.

Check the current URL:
- Redirected to `/login`, `/sign-in`, `/auth` → session not active, ask for credentials.
- Dashboard / main nav visible → session already active, skip to Step 2.

If login needed: read `.env` for `QA_USERNAME` / `QA_PASSWORD` / `QA_OTP_CODE` first.
Only if still missing, ask for email + password in one message (never print the password).

Store: `EMAIL`, `PASSWORD`, `OTP_CODE`.

Once all inputs collected:
> "Got it — logging in and starting the accessibility checks..."

---

## Step 1 — Login to the Application

**Skip entirely if Step 0 Q3 confirmed session already active.**

1. `browser_wait_for(state: "networkidle")`
2. `browser_snapshot()` — **one allowed snapshot** to read login form selectors
3. `browser_fill` email field using selector found
4. `browser_fill` password field using selector found
5. `browser_click` login / sign-in button
6. `browser_wait_for(state: "networkidle")`

**If OTP screen appears** (6-digit input / PIN boxes):
7. `browser_click` first OTP input box
8. `browser_type(text: OTP_CODE)` — the `QA_OTP_CODE` value from `.env`, auto-advances through boxes
9. `browser_click` Verify / Confirm button
10. `browser_wait_for(state: "networkidle")`

Confirm login success: main nav or dashboard visible → proceed.
Still on login page → stop and report: `"Login failed — please verify credentials."`

**Save authenticated session to disk:**
```javascript
browser_evaluate({
  expression: `JSON.stringify({
    localStorage:   Object.fromEntries(Object.entries(localStorage)),
    sessionStorage: Object.fromEntries(Object.entries(sessionStorage)),
    cookies:        document.cookie
  })`
})
```
Write result to `.playwright-session.json`.

Run `login` token checkpoint.

---

## Step 2 — Navigate to Target Page + Baseline Screenshot

1. `browser_navigate(url: TARGET_URL)`
2. `browser_wait_for(state: "networkidle")`
3. Take baseline screenshot via Playwright CLI (zero response tokens):

```bash
mkdir -p outputs/screenshots
npx playwright screenshot \
  --browser chromium \
  --full-page \
  --viewport-size "1920,1080" \
  --wait-for-timeout 3000 \
  "TARGET_URL" \
  outputs/screenshots/a11y-baseline-URL_SLUG.png
```

Store as `BASELINE_SCREENSHOT = outputs/screenshots/a11y-baseline-[URL_SLUG].png`.

---

## Step 3 — axe-Core Automated Checks

Load `.claude/skills/QE-Web/WCAG_CHECKS.md` now.

### 3a — Inject axe-core

Run the **axe-Core Injection Script** from `WCAG_CHECKS.md` via `browser_evaluate`.

- Returns `"loaded"` or `"already loaded"` → proceed to 3b.
- Returns rejection / CDN error → set `AXE_BLOCKED = true`, add note to report:
  `"axe-core CDN blocked by CSP — automated checks skipped, manual checks only."`,
  skip to Step 4.

### 3b — Run axe-core

Run the **axe-Core Run Script** from `WCAG_CHECKS.md` via `browser_evaluate`.
Parse the returned JSON. Store as `AXE_RESULT`.

Bucket violations by impact:
- `CRITICAL_VIOLATIONS` — impact: `"critical"`
- `SERIOUS_VIOLATIONS` — impact: `"serious"`
- `MODERATE_VIOLATIONS` — impact: `"moderate"`
- `MINOR_VIOLATIONS`   — impact: `"minor"`

Show one-line tally in chat:
> `"axe-core: [N] critical | [N] serious | [N] moderate | [N] minor violations found."`

Run `a11y_checks` token checkpoint.

---

## Step 4 — Manual Checks

Load `.claude/skills/QE-Web/WCAG_CHECKS.md`.

Run each script via `browser_evaluate`. Store results for the report.

### Check A — Keyboard Traversal (WCAG 2.1.1)
Run **Check A — Keyboard Traversal Script**.
Record: total focusable count, elements removed from tab order, first 10 elements.
Flag if: focusableCount = 0, or interactive elements like buttons/inputs appear in `removedFromTab`
that should be reachable.

### Check B — Focus Visibility (WCAG 2.4.7)
Run **Check B — Focus Visibility Script**.
Flag if: `outlineNoneCount > 0` (outline suppressed on focused elements) or `totalFocusRules = 0`.
Note if `hasFocusVisible = true` (modern `:focus-visible` present — good practice).

### Check C — Skip Navigation Link (WCAG 2.4.1)
Run **Check C — Skip Navigation Link Script**.
Flag if: `hasSkipLink = false`.

### Check D — Heading Hierarchy (WCAG 1.3.1)
Run **Check D — Heading Hierarchy Script**.
Report all issues from `issues[]` array.
Flag if: `h1Count ≠ 1` or `levelSkips.length > 0`.

### Check E — Image Alt Text (WCAG 1.1.1) — cross-check against axe
Run **Check E — Image Alt Text Script**.
Flag if: `missingAlt > 0`. Note `emptyAlt` (decorative images with empty alt = OK if intentional).
Flag if: `svgMissingLabel > 0` (inline SVGs without accessible name).

---

## Step 5 — Generate + Save Report

Load the **Report Template** from `WCAG_CHECKS.md`.

Build the full report using:
- `AXE_RESULT` — all violation buckets
- Manual check results from Steps A–E
- `BASELINE_SCREENSHOT` path
- `WCAG Criterion Quick Reference` and `Severity Mapping` from `WCAG_CHECKS.md`

Derive filename: `outputs/a11y-report-[URL_SLUG]-[YYYYMMDD].html`

Save the file. Tell user (one line):
> `"Report saved: outputs/a11y-report-[URL_SLUG]-[YYYYMMDD].html"`

Run `end + report + session` token close-out.

---

## Step 6 — Jira Bug Filing

**Skip entirely if `FILE_JIRA = false`.**

> `"[Step 6] Drafting an accessibility comment for [JIRA_CARD_ID]..."`

Use `getJiraIssue` to confirm `JIRA_CARD_ID` exists (read-only — no confirmation needed).
Extract `PROJECT_KEY`.

### Compose one comment covering every finding

Per the **Jira Write Rule** in `SKILLS_CONTEXT.md`, every violation found — critical,
serious, moderate, and minor alike — is logged as **one comment on `JIRA_CARD_ID`**,
never as a separate Jira issue. Build the comment using the **Jira Comment Template
(All Violations)** from `WCAG_CHECKS.md`: critical/serious violations get the full
steps/expected/actual block, moderate/minor get the compact table, and the results
tally + report path go at the top.

### Confirm before posting

Show the composed comment and ask:
> "Post this as a comment on [JIRA_CARD_ID]? ([N] critical, [N] serious, [N] moderate,
> [N] minor) (yes / no / edit)"

Wait for an explicit reply — never post on silence. Apply requested edits and re-show
before asking again. Proceed only on an explicit **yes**.

### Post (only after confirmation)

`addCommentToJiraIssue` on `JIRA_CARD_ID` with the confirmed text — one call, one comment.

---

## Final Chat Summary

```
Accessibility Testing Complete
  Page          : [TARGET_URL]
  WCAG Level    : 2.1 AA

  Critical      : N violations
  Serious       : N violations
  Moderate      : N violations
  Minor         : N violations

  Keyboard      : OK / N interactive elements unreachable
  Focus styles  : OK / outline:none found on N selectors
  Skip link     : Present / Missing (WCAG 2.4.1)
  Heading order : OK / [issues]
  Image alt     : OK / N missing alt attributes

  Jira          : posted as a comment on [JIRA_CARD_ID] / declined / skipped
  Report        : outputs/a11y-report-[URL_SLUG]-[YYYYMMDD].html
```

---

## Error Handling

| Situation | Action |
|-----------|--------|
| Login fails | Stop — `"Login failed, please check credentials."` |
| TARGET_URL not reachable after login | Stop — check URL and auth redirect |
| axe-core CDN blocked (CSP) | Flag in report, continue with manual checks only |
| `axe.run()` throws / times out | Retry scoped to `main` or `#content` only, note partial result |
| `browser_evaluate` returns null | Log "script returned null" for that check, continue |
| Jira card not found | Ask to verify key; offer to save report only |
| User replies "no" at the Step 6 confirmation | Do not post. Ask whether to edit and re-show, or skip Jira entirely for this run |
| Jira comment post fails | Report the failure, ask whether to retry |
| OTP screen appears unexpectedly | Type the `QA_OTP_CODE` value from `.env`, proceed |
| Page requires further navigation after login | Follow redirect, confirm TARGET_URL loads |
