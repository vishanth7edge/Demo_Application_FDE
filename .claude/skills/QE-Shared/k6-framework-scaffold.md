---
name: k6-framework-scaffold
description: Scaffold a ready-to-use k6 load-testing framework (Grafana Cloud) in a repo. Creates the k6-performance-tests/ tree — shared config/ + lib/, a protocol/ (API load) layer with api/flows/tests, and an OPTIONAL browser/ (UI) layer — with commented template files that testers then fill in. Use when someone asks to "set up k6", "create the k6 load testing structure/framework", "scaffold performance tests", or start load testing a new app.
compatibility: >
  Standalone skill — not part of the qa-agent pipeline. The bundled scaffold.sh writes the
  files, then runs install-k6.sh to install the k6 CLI if it is missing (no sudo; needs
  network). A Grafana Cloud account is only needed later, for k6 cloud run.
---

 **Note:** No longer an independently-triggered Claude Code skill and no longer has its own slash command. It's read and executed by /web-qa-agent or /mobile-qa-agent when the user picks **k6-framework-scaffold** from its menu — the full procedure below still applies exactly as written.

# k6 Framework Scaffold

Generates a standard, reusable k6 performance-testing framework so a tester can start from a
ready structure and just fill in their app's endpoints, weights, and tokens.

## What it creates
k6-performance-tests/
├── config/     env.js · secrets.js · profiles.js        (shared: URLs, tokens, load shapes)
├── lib/        http.js · rand.js · browser.js           (shared helpers)
├── protocol/   api/{userTypeA,userTypeB}/ · flows/ · tests/{smoke,load,spike,breakpoint,endurance}/
│               ── API / HTTP load — the CORE, needed for every app
├── browser/    pages/ · flows/ · tests/
│               ── real-browser UX — OPTIONAL, only for UI-heavy apps (delete if unneeded)
└── README.md

Design principle: **separate WHAT we test (api → flows) from HOW MUCH load (profiles → tests)**,
so the same endpoints/journeys are reused across every test type. All files are commented
templates with TODOs.

## How to run it

From the target repo root, run the bundled script:
bash
bash .claude/skills/QE-Shared/scaffold.sh

It creates k6-performance-tests/ in the current directory.
It is **safe**: if k6-performance-tests/ already exists it aborts (won't overwrite).
  Pass --force to scaffold into an existing folder (only adds missing files; still never
  overwrites an existing file).
After writing files it runs install-k6.sh, which **installs the k6 CLI if it isn't already
  on PATH** (skip with --no-install). It never prompts or uses sudo:
  - macOS: brew install k6 when Homebrew is present.
  - Windows (Git Bash): winget or choco.
  - Otherwise (Linux, macOS without brew): downloads the official release from GitHub,
    verifies its SHA-256, and puts k6 in ~/.local/bin (override with K6_INSTALL_DIR;
    pin a version with K6_VERSION=v1.x.y).
  - A failed install only warns — the scaffold still succeeds.
To install k6 on its own (e.g. a repo that was scaffolded earlier):
  bash .claude/skills/QE-Shared/install-k6.sh

Report the installer's output to the tester: the k6 version installed (or already present), and
pass on any NOTE: ... not on your PATH line or install WARN verbatim.

After it runs, tell the tester the next steps:
1. config/env.js — set BASE (API URL), UI_BASEs, PROJECT_ID, scale numbers, test data.
2. config/secrets.js — paste auth tokens/credentials (git-ignored pattern).
3. protocol/api/** — replace the sample endpoints with the real ones (one function per call).
4. protocol/flows/** — set the weighted action table (feature-usage %) + thresholds (SLA).
5. Browser layer is **optional** — keep it only for UI-heavy apps; otherwise delete browser/.
6. k6 cloud login --token <token> (only for Grafana Cloud), then run from inside k6-performance-tests/:
   k6 run protocol/tests/smoke/example.smoke.js (local) or k6 cloud run ....

## Notes
The script writes files and installs k6 if missing; it never runs tests.
Keep real tokens out of version control (the scaffold's .gitignore covers secrets.local.*).
If the user wants the structure tailored (their user types, real endpoints from a Postman collection), scaffold first, then edit the generated templates to match.