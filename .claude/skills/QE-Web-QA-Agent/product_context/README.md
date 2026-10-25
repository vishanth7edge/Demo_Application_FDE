# Product Context Store

Each subfolder here is named after a product (e.g. `INDY/`, `POZYTRON/`, `ZOODPAY_ADMIN/`).

The QA Agent writes to `{PRODUCT}/context.md` automatically at the end of every run.

## Folder naming rules
- Uppercase, no spaces — use `_` instead
- Derived from the Jira project name (not the card key)
- Examples:
  - "Indy Auction" → `INDY/`
  - "Pozytron Radiologia" → `POZYTRON/`
  - "ZoodPay Admin" → `ZOODPAY_ADMIN/`

## What context.md contains
- Runs log (one row per QA session)
- Known bugs accumulated across all runs
- Covered test flows
- Environment notes (URLs, quirks — never credentials; those live only in `.env`)

## Other files that may appear in a product folder

These are written and read exclusively by `.claude/skills/QE-Web-QA-Agent/toolkit/qa-toolkit.cjs`
— never edited by hand, never read in full by a skill (only queried through the toolkit).
They exist so features like duplicate-bug detection, DOM-change skipping, and locator
learning don't have to re-derive their state from `context.md` every run.

| File | Written by | Purpose |
|------|-----------|---------|
| `dom-fingerprints.json` | `fingerprint` command | One hash per page URL — lets a run skip DOM re-discovery when nothing changed |
| `trust.json` (or `trust.mobile.json` under `--namespace mobile`) | `trust-record` command | Gate 1 / Gate 2 clean-approval streaks — feeds the auto-approve trust ratchet. Web and mobile automation runs share one product folder but keep separate trust files via the namespace flag |
| `locator-learnings.md` | `locator-record` command | Locators that broke before, and what fixed them — read before writing new POM code |

All three are covered by the same `.claude/skills/QE-Web-QA-Agent/` gitignore entry as
`context.md` — they never leave the machine that generated them. This folder is shared by
both `/web-qa-agent` and `/mobile-qa-agent` — a product tested from both web and mobile
still gets one `context.md`.
