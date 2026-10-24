---
name: k6-framework-scaffold
description: Scaffold a ready-to-use k6 load-testing framework (Grafana Cloud) in a repo. Creates the k6-performance-tests/ tree — shared config/ + lib/, a protocol/ (API load) layer with api/flows/tests, and an OPTIONAL browser/ (UI) layer — with commented template files that testers then fill in. Use when someone asks to "set up k6", "create the k6 load testing structure/framework", "scaffold performance tests", or start load testing a new app.
compatibility: >
  Standalone skill — not part of the qa-agent pipeline. The bundled scaffold.sh only writes
  files; the k6 CLI (and a Grafana Cloud account for `k6 cloud run`) is only needed later,
  when the tester actually runs the generated tests.
---

> **Note:** No longer an independently-triggered Claude Code skill and no longer has its own slash command. It's read and executed by `/web-qa-agent` or `/mobile-qa-agent` when the user picks **k6-framework-scaffold** from its menu — the full procedure below still applies exactly as written.

# k6 Framework Scaffold

Generates a standard, reusable k6 performance-testing framework so a tester can start from a
ready structure and just fill in their app's endpoints, weights, and tokens.

## What it creates

```
k6-performance-tests/
├── config/     env.js · secrets.js · profiles.js        (shared: URLs, tokens, load shapes)
├── lib/        http.js · rand.js · browser.js           (shared helpers)
├── protocol/   api/{userTypeA,userTypeB}/ · flows/ · tests/{smoke,load,spike,breakpoint,endurance}/
│               ── API / HTTP load — the CORE, needed for every app
├── browser/    pages/ · flows/ · tests/
│               ── real-browser UX — OPTIONAL, only for UI-heavy apps (delete if unneeded)
└── README.md
```

Design principle: **separate WHAT we test (api → flows) from HOW MUCH load (profiles → tests)**,
so the same endpoints/journeys are reused across every test type. All files are commented
templates with `TODO`s.

## How to run it

From the target repo root, run the bundled script:

```bash
bash .claude/skills/QE-Shared/scaffold.sh
```

- It creates `k6-performance-tests/` in the current directory.
- It is **safe**: if `k6-performance-tests/` already exists it aborts (won't overwrite).
  Pass `--force` to scaffold into an existing folder (only adds missing files; still never
  overwrites an existing file).

After it runs, tell the tester the next steps:
1. `config/env.js` — set `BASE` (API URL), `UI_BASE`s, `PROJECT_ID`, scale numbers, test data.
2. `config/secrets.js` — paste auth tokens/credentials (git-ignored pattern).
3. `protocol/api/**` — replace the sample endpoints with the real ones (one function per call).
4. `protocol/flows/**` — set the weighted action table (feature-usage %) + thresholds (SLA).
5. Browser layer is **optional** — keep it only for UI-heavy apps; otherwise delete `browser/`.
6. Install k6, `k6 cloud login --token <token>`, then run from inside `k6-performance-tests/`:
   `k6 run protocol/tests/smoke/example.smoke.js` (local) or `k6 cloud run ...`.

## Notes
- The script only writes files; it does not install k6 or run tests.
- Keep real tokens out of version control (the scaffold's `.gitignore` covers `secrets.local.*`).
- If the user wants the structure tailored (their user types, real endpoints from a Postman
  collection), scaffold first, then edit the generated templates to match.
