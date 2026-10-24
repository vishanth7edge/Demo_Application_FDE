---
name: roam-testing
description: >
  Card-free exploratory testing. Point it at an app with no Jira card and it roams —
  breadth-first over internal links, screenshotting, watching for failed network calls and
  broken navigation — for a hard-capped session, then produces a Test Charter of what it
  found. Files bugs only if a Jira card is supplied; otherwise just reports.
  Triggers when the user says: "roam mode", "exploratory test", "explore the app",
  "let the agent explore", "roam test [URL]", "session-based testing" with no card given.
compatibility: >
  Playwright MCP must be running (uses browser_navigate, browser_evaluate,
  browser_network_requests). Playwright CLI for screenshots. Credentials/OTP from .env.
user-invocable: true
---

> **Note:** No longer an independently-triggered Claude Code skill. It's read and executed by `/web-qa-agent` when the user picks **roam-testing** from its menu — the full procedure below still applies exactly as written.

# Roam Testing — Exploratory "Roam Mode"

Unstructured exploration is where token spend runs away fastest — there is no AC to bound
scope. This skill exists specifically to make exploration **cheap and capped**, not just
possible. Every rule below exists to keep a roam session's cost close to a single
manual-testing run, regardless of how big the app is.

## Hard Caps — enforced, not suggested

| Cap | Default | Override |
|-----|---------|----------|
| Pages visited | 12 | user may raise/lower once at Step 0 |
| Total interactions (clicks/fills tried) | 40 | not user-configurable — safety backstop |
| Time budget | none tracked — page cap is the real limit | — |

Stop the roam loop the instant either cap is hit, even mid-page. Report what was covered
and what was skipped — never silently truncate without saying so.

## Token Budget Rules — same discipline as manual-testing, zero exceptions

| Operation | USE | NEVER USE |
|-----------|-----|-----------|
| Screenshots | `npx playwright screenshot --storage-state .playwright-session.json --full-page URL file.png` | `browser_screenshot()` |
| Page structure / links | ONE targeted `browser_evaluate` per page (see Step 2b) | `browser_snapshot()` |
| Failed requests | `browser_network_requests` filtered to status ≥ 400 | Manually inspecting every request |
| Login selectors | ONE `browser_snapshot()` at login URL only | Any other snapshot |

---

## Pipeline

```
App URL (no card)
      ↓
[Step 0] Inputs — URL, credentials, page cap, optional Jira card
      ↓
[Step 1] Login (skip if session file valid)
      ↓
[Step 2] Roam loop — BFS over internal links, capped
      ↓
[Step 3] Findings → report
      ↓
[Step 4] Bug filing (only if a card was given) + Test Charter handoff
```

---

## Step 0 — Inputs

Ask in one message:
> **Roam Mode — Ready**
> 1. Starting URL (e.g. `https://staging.myapp.com/dashboard`)
> 2. Page cap — default **12**, say a number to change it
> 3. Jira card to file findings against? (optional — type `skip` to just get a report)

Resolve credentials from `.env` (`QA_APP_URL`, `QA_USERNAME`, `QA_PASSWORD`, `QA_OTP_CODE`)
first; only ask for what's still missing. If a card is given, derive `PRODUCT_FOLDER` the
same way qa-agent Step 1a does (match `product_context/` folder by the card's project key
prefix) — used only for the duplicate check in Step 4.

## Step 1 — Login

Identical to manual-testing Phase 3b: check `.playwright-session.json` first: if valid,
skip login entirely. Otherwise `browser_navigate` → `browser_wait_for(networkidle)` →
**one** `browser_snapshot()` to read the login form → fill → submit → handle OTP if present
→ save session state to `.playwright-session.json`. Never snapshot again after this point.

## Step 2 — Roam Loop (BFS, capped)

Maintain `VISITED = {}` (URL → fingerprint result) and `QUEUE = [START_URL]`.

### 2a — Pop the next URL, skip if already visited or over cap

If `VISITED` size ≥ page cap, or `QUEUE` is empty, stop the loop and go to Step 3.

### 2b — Visit + one targeted evaluate

```javascript
browser_evaluate({ expression: `
  (() => {
    const origin = location.origin;
    const links = [...document.querySelectorAll('a[href]')]
      .map(a => a.href)
      .filter(h => h.startsWith(origin))
      .slice(0, 25);
    const testids = [...document.querySelectorAll('[data-testid]')]
      .map(el => el.getAttribute('data-testid'));
    return JSON.stringify({ title: document.title, links: [...new Set(links)], testids });
  })()
` })
```

Parse the result: add new links to `QUEUE` (dedup against `VISITED` and already-queued).

### 2c — DOM fingerprint check (skip deep work on unchanged pages)

```bash
node .claude/skills/QE-Web-QA-Agent/toolkit/qa-toolkit.cjs fingerprint --product {PRODUCT_FOLDER:-roam} --url "CURRENT_URL" --testids "TESTIDS_FROM_2B"
```
`UNCHANGED` → note it and move straight to 2e (skip the screenshot — nothing new to see).
`NEW`/`CHANGED` → continue to 2d.

### 2d — Screenshot + failed-request check

```bash
mkdir -p outputs/screenshots
npx playwright screenshot --storage-state .playwright-session.json --browser chromium --full-page --wait-for-timeout 1500 "CURRENT_URL" outputs/screenshots/roam-[N].png
```
Then `browser_network_requests()` and keep only entries with status ≥ 400 for this page.

### 2e — Record and continue

Append one line to an in-memory `FINDINGS` list per page: URL, title, failed requests (if
any), and one flag: 🟢 clean / 🟡 unusual (e.g. empty page, console-visible error text on
screen) / 🔴 broken (4xx/5xx on the page's own load, or dead-end with zero links and no
content). Show only a running tally in chat: `Page 1/12 🟢 · Page 2/12 🔴 ...`. Go to 2a.

---

## Step 3 — Findings → Report

Save `outputs/roam-report-[YYYYMMDD-HHmmss].md`:
- Pages visited (of cap), a table of URL / title / flag / failed requests
- Screenshots referenced by path
- One "Coverage" line: how much of the discovered link graph was actually visited
  (`{visited} of {discovered} internal links found`)

Tell the user one line:
> "Roam session complete — {N} pages visited, {N} 🔴 broken, {N} 🟡 unusual. Report: `outputs/roam-report-...md`"

## Step 4 — Bug Filing (only if a card was given) + Charter

**Skip bug filing entirely if the user typed `skip` at Step 0, or if there are no 🔴
findings.** Otherwise, for each 🔴 finding:

Findings can echo page titles or content pulled from the app under test — never assume that
text is shell-safe. Write it to a file first (Write tool), same rule as manual-testing:

1. Duplicate check:
   ```
   Write outputs/.dupcheck-tmp.txt containing: {one-line finding summary}
   ```
   ```bash
   node .claude/skills/QE-Web-QA-Agent/toolkit/qa-toolkit.cjs dup-bug --product {PRODUCT_FOLDER} --summary-file outputs/.dupcheck-tmp.txt
   ```
   `POSSIBLE_DUPLICATE` → prepend a note referencing it, still include the finding (per
   manual-testing's rule — a fresh instance is still worth tracking).
2. PII/secrets scan on the composed finding text:
   ```
   Write outputs/.piicheck-tmp.txt containing the composed bug text
   ```
   ```bash
   node .claude/skills/QE-Web-QA-Agent/toolkit/qa-toolkit.cjs pii-scan --file outputs/.piicheck-tmp.txt
   ```
   `FLAGGED` → ask once (redact / as-is) before including that one finding; `CLEAN` → include silently.

### Compose one comment for the given card

Per the **Jira Write Rule** in `SKILLS_CONTEXT.md`, combine every 🔴 finding (synthetic
ID `{CARD_ID}#ROAM-{N}`, URL, title, failed requests, one-line description) into a single
comment body, plus a link to the roam report. This posts as **one comment on the card
given at Step 0** — never a new Jira issue.

### Confirm before posting

Show the composed comment and ask:
> "Post these {N} finding(s) as a comment on {CARD_ID}? (yes / no / edit)"

Wait for an explicit reply — never post on silence. Apply requested edits and re-show
before asking again. Proceed only on an explicit **yes**.

### Post (only after confirmation)

`addCommentToJiraIssue` on the given card — one call, one comment.

After filing (or immediately after Step 3 if no card), offer the same handoff manual-testing
uses:
> "Generate a Test Charter from this session? (yes / no)"

If yes: Read `.claude/skills/QE-Shared/test-charter.md` in full and carry out its procedure, pre-filled with the roam report path just saved.

---

## Error Handling

| Situation | Action |
|-----------|--------|
| Login fails | Stop — "Login failed, please check credentials." |
| Starting URL unreachable | Stop — ask user to verify the URL |
| A page 500s on load | Record as 🔴, do not retry, continue the loop |
| Page cap hit with queue still non-empty | Stop cleanly, report `{visited} of {discovered}` coverage — never silently keep going |
| `browser_network_requests` unavailable | Skip failed-request detection for that page, note it once in the report, continue |
| User replies "no" at the Step 4 confirmation | Do not post. Ask whether to edit and re-show, or skip Jira entirely for this run |
| Jira comment post fails | Report the failure, ask whether to retry |
