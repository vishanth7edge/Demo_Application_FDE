# QA Skills — Context Map

**qa-pack version: {{QA_PACK_VERSION}}**

<!-- Load this instead of individual procedure files when you only need pipeline
     structure. Load a specific file under QE-Web/, QE-Mobile/, or QE-Shared/ only when you are
     about to carry out that procedure. -->

## Structure — read this first

As of this version, only two things under .claude/skills/ are real, independently
discoverable Claude Code skills (Claude Code only auto-discovers
.claude/skills/<name>/SKILL.md, exactly one level deep):

| Skill folder | Command | Role |
|---|---|---|
| QE-Web-QA-Agent/ | /web-qa-agent | Entry point for the whole web QA track — card-driven phase pipeline, product context, and the menu for every standalone web procedure |
| QE-Mobile-QA-Agent/ | /mobile-qa-agent | Entry point for the mobile QA track — a thin menu, since mobile procedures are already self-contained |

Everything else — automation, manual-testing, accessibility-testing, ui-test-figma,
roam-testing, mobile-automation, mobilewright-setup, bug-reporting, test-charter,
qa-insights, impacted-tests, delete-files, k6-framework-scaffold, trm-audit — is
now a **plain reference file**, one level too deep to be auto-discovered, living under:

.claude/skills/QE-Web/ — web-only procedures (automation.md, manual-testing.md,
  accessibility-testing.md, ui-test-figma.md, roam-testing.md, plus their companion
  reference files: BDD_TEMPLATES.md, LOCATOR_PATTERNS.md, WCAG_CHECKS.md,
  TEST_DESIGN_GUIDE.md, COMPARISON_PATTERNS.md)
.claude/skills/QE-Mobile/ — mobile-only procedures (automation.md = former
  mobile-automation, setup.md = former mobilewright-setup, plus companions
  BDD_TEMPLATES.md, LOCATOR_PATTERNS.md, MOBILE_MCP_REFERENCE.md)
.claude/skills/QE-Shared/ — used by both tracks (bug-reporting.md, test-charter.md,
  qa-insights.md, impacted-tests.md, delete-files.md, k6-framework-scaffold.md +
  scaffold.sh + install-k6.sh, trm-audit.md + TRM_FRAMEWORK.md + measure-reuse.cjs)

None of these are invoked via a "Skill:" tool call anymore. web-qa-agent and
mobile-qa-agent dispatch to them by **reading the file in full and carrying out its
procedure inline**, exactly as if it were their own instructions. The old per-skill
slash commands (/bug-report, /impacted-tests, /trm-audit, /mobilewright-setup)
and natural-language triggers for these are retired — reach them through
/web-qa-agent or /mobile-qa-agent's menu instead.

The shared toolkit and product context store live under QE-Web-QA-Agent/ (not duplicated
into QE-Mobile-QA-Agent/) — see "The Toolkit" below.

## Secrets Rule — All Skills Must Follow

App URL, credentials, OTP code, and Jira REST tokens live in .env at the repo root
(QA_APP_URL, QA_LOGIN_URL, QA_USERNAME, QA_PASSWORD, QA_OTP_CODE,
JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN).

Read .env ONCE at skill start (Read tool). Precedence: .env > product context > ask the user.
**Never print QA_PASSWORD or JIRA_API_TOKEN** to chat, reports, hints files, or product context.
Never write credentials into context.md, CLAUDE.md, or any outputs/ file.
If a required value is missing from .env, ask for it once and suggest the user add it to .env.

## Jira Write Rule — All Skills Must Follow

Any Jira action that **writes** data — createJiraIssue, editJiraIssue,
addCommentToJiraIssue, createIssueLink, transitionJiraIssue,
addWorklogToJiraIssue, or a REST attachment upload — requires explicit user
confirmation **before** it runs. Read-only calls (getJiraIssue,
getVisibleJiraProjects, searchJiraIssuesUsingJql, getTransitionsForJiraIssue,
lookupJiraAccountId) never need confirmation and should never be gated.

Show the user exactly what is about to be written (the comment/description text, the
  issue fields, the link) before calling the write tool. One confirmation per batch of
  writes belonging to the same step is enough — don't ask once per individual API call
  inside an already-approved batch (e.g. filing screenshots after a bug comment was just
  confirmed doesn't need its own separate prompt).
Wait for an explicit reply. Never write on silence, and never treat "no answer yet" as
  approval. If the user asks for edits, apply them, re-show, and ask again.
**AUTO_APPROVE (web-qa-agent's full-pipeline flag) does not apply to this rule.**
  AUTO_APPROVE=true skips phase-level menus and automation's Gate 1/Gate 2 — it never
  skips a Jira write confirmation. A Jira write is external and hard to reverse; ask
  every time, auto-approved run or not.
**Bugs found during a test run are logged as a comment on the card already being
  tested (CARD_ID) — never as a new Jira issue.** This applies to manual-testing,
  accessibility-testing, roam-testing, and ui-test-figma: one comment covering
  every finding from that run, not a separate child bug per finding. It keeps the
  card's own history as the single record instead of scattering lookalike tickets.
  The one deliberate exception is bug-reporting's **Exploratory Bug** mode, which
  exists specifically for a bug with no card to attach to — the user chooses that mode
  explicitly each time, and it still gates on confirmation before writing.

## Global Token Rules — All Skills Must Follow

These rules apply to every skill, every run. Violating them is the single biggest source of token waste.
A 10-test run with browser_snapshot() per test = ~100k wasted tokens.

### Browser tool rules

| Operation | USE | NEVER USE | Token cost of violation |
|-----------|-----|-----------|------------------------|
| Screenshots | npx playwright screenshot --full-page URL file.png | browser_screenshot() | ~3k per image |
| DOM reading | browser_evaluate with targeted CSS/JS | browser_snapshot() | ~10k per call |
| Login selectors | ONE browser_snapshot() at login URL only | browser_snapshot() on any other page | one-time cost justified |
| Session reuse | --storage-state .playwright-session.json for all CLI calls | Re-logging in each run | login round-trip wasted |

### Context output rules

| Content | Output to | Never output to |
|---------|-----------|-----------------|
| Full test reports | File (outputs/) | Chat |
| Full bug descriptions | Jira via MCP | Chat |
| Gherkin feature files | Write tool (disk) | Pasted in full to chat |
| Step definitions | Write tool (disk) | Pasted in full to chat |
| POM class | Write tool (disk) | Pasted in full to chat |
| Token tracking output | Suppressed entirely | Chat |

**Chat shows only:** phase announcements (1 line each), running test count, failure IDs, bug keys, final summary table.

### Static file load rules

| File | Load | Frequency |
|------|------|-----------|
| QE-Web/BDD_TEMPLATES.md | Once at Phase 1 start (automation) | Never reload in the same run |
| QE-Web/LOCATOR_PATTERNS.md | Once at Phase 1 start (automation) | Never reload in Phase 2 or 3 |
| QE-Web/WCAG_CHECKS.md | Once at skill start (accessibility-testing) | Never reload |
| QE-Web/TEST_DESIGN_GUIDE.md | Once at Phase 1c (manual-testing) | Never reload — reference sections by number (§1–§9) |
| QE-Mobile/MOBILE_MCP_REFERENCE.md, QE-Mobile/BDD_TEMPLATES.md, QE-Mobile/LOCATOR_PATTERNS.md | Once at Phase 2 start (mobile automation) | Never reload in Phase 3 or 4 |
| QE-Shared/TRM_FRAMEWORK.md | Once at skill start (trm-audit) | Never reload — reference sections by number (§1–§6) |
| QE-Shared/test-charter.md | Once when charter starts | Never reload |
| context.md | Once at web-qa-agent Step 0 | Never reload |

After loading, reference rules by name only (e.g. "per Locator Priority Rule 1").
**Never re-quote static content** in follow-up messages — it is already in context.

### Prompt structure for cache efficiency

Structure every skill invocation in this order so the stable prefix can be cached by Anthropic:
[1] STABLE (cache-eligible — never changes between runs on same product)
    Product context (context.md) + skill instructions (SKILL.md) + static templates loaded at start


[2] VARIABLE (changes every run — goes last)
    Card ID + fetched card data + test results + current session data

The stable block qualifies for Anthropic prompt caching when it exceeds 1024 tokens.
Cache TTL is 5 minutes. Keep the stable block identical across runs for the same product.

### The Toolkit — the low-token path for anything product_context-shaped

.claude/skills/QE-Web-QA-Agent/toolkit/qa-toolkit.cjs is a dependency-free Node script, not
a skill. It exists because parsing a markdown table, hashing a DOM snapshot, scoring string
similarity, or aggregating dozens of products' history is pure computation — routing it
through the model (Read the file → reason over it → maybe Edit it back) burns tokens on work
that doesn't need a model at all. **Any procedure needing one of the things below calls the
toolkit and reads only its one-line result — never Read a whole context.md for this.**

It lives under QE-Web-QA-Agent/ rather than being duplicated into QE-Mobile-QA-Agent/ — both
tracks call this same script and share the same product_context/ store (see below), so a
product tested from both web and mobile keeps one context.md.
bash
node .claude/skills/QE-Web-QA-Agent/toolkit/qa-toolkit.cjs <command> [--flags]

| Command | Used by | Purpose |
|---------|---------|---------|
| get-bugs / get-runs / get-selectors --product P | any procedure | Cheap reads of one context.md table, pipe-delimited rows |
| fingerprint --product P --url U --testids "a,b" | manual-testing, automation, mobile automation, roam-testing | DOM/screen fingerprint cache — UNCHANGED means skip re-discovery. Mobile uses a synthetic mobile:{bundleId}/{Screen} string as --url and resource-id/accessibility-id values as --testids — the command itself is platform-agnostic |
| pii-scan (stdin or --file) | bug-reporting, manual-testing, roam-testing | Flags emails/keys/tokens before anything is posted to Jira |
| dup-bug --product P --summary S | bug-reporting, manual-testing, roam-testing | Fuzzy-matches a new bug against Known Bugs, no LLM comparison needed |
| cost-estimate --product P [--phase N] | web-qa-agent | One-line run-cost estimate from Runs Log history |
| risk-score --product P --modules "a,b" | manual-testing | Orders tests by git churn + past bug density, not AC order |
| trust-record / trust-status --product P [--namespace N] | automation, mobile automation (--namespace mobile — routes to a separate trust.mobile.json so its gate streaks never enter web-qa-agent's web-only eligibility computation), web-qa-agent (status) | Trust ratchet on Gate 1/Gate 2 approvals. --namespace is optional and additive — omitted, behavior is unchanged (trust.json); trust-status takes min(streak) across every gate in whichever file it reads, so gates from two automation surfaces must never share one file |
| locator-record / locator-query --product P --page U | automation, mobile automation (page keys prefixed mobile: to avoid colliding with web page URLs) | Self-improving locator memory across self-heal fixes |
| compact-context --product P | web-qa-agent, as its own step 6f, every run | Periodic context.md compaction — a no-op counter increment 4 runs out of 5 (NOT_DUE (n/5)), then on the 5th it rolls old Runs Log rows into one summary row, archives closed bugs beyond the most recent 20, dedupes Element Selectors/Covered Flows (last write wins), and trims Environment Notes to the most recent 15 lines. Nothing is ever deleted — full originals move to product_context/[PRODUCT]/history/. --force compacts immediately regardless of the counter. |
| dashboard / digest [--days N] / roi | qa-insights | Cross-product reports — 100% script-generated, zero synthesis. Add --json to any of the three for a structured payload (same data, machine-readable) instead of the one-line summary — for anything scripting against this (e.g. an external dashboard app) rather than chatting with it. |

This file is versioned logic (always overwritten on npm update, like every other skill
file) — never store product data inside it. Its outputs live under
product_context/{PRODUCT}/ (dom-fingerprints.json, trust.json,
locator-learnings.md — all new, all gitignored the same way context.md already is) or
outputs/ (dashboard.html, qa-weekly-digest-*.md, roi-report.md).

The toolkit reads .env from the repo root itself (real environment variables win), so
every QA_* value documented for .env reaches it without the calling skill exporting
anything. Before this, QA_TRACKING_DIR was read straight off
process.env and were therefore permanently unset in normal skill use.

**Never inline arbitrary text into a toolkit shell call.** Bug descriptions, locator
strings, and anything else that isn't a short agent-controlled token (a card ID, a product
folder name, a URL) can contain quotes, ``  ``, $(...), or |` — inlined into a bash
argument, that is a command-injection bug, not just an escaping nuisance. Write the text to
a file with the Write tool first and pass the path: pii-scan --file, `dup-bug
--summary-file`, locator-record --file <json>. Only short, structurally-constrained values
(URLs, card IDs, product folder names) are safe to inline directly.

---

## Pipeline Overview
Jira Card ID (Atlassian MCP)
         │
         ▼
  ┌────────────────┐
  │  web-qa-agent   │  ← entry point: card → context → gap questions → phase menu
  └───────┬─────────┘
          │
   ┌──────┼──────────────┐
   ▼      ▼              ▼
[PHASE 1]  [PHASE 2]  [PHASE 3 = Phase 1 THEN Phase 2]
 MANUAL     AUTOMATION   (manual first — its automation-hints
   │            │         file feeds Phase 2's selectors)
   ▼            ▼
QE-Web/ui-test-figma.md   reuse audit (step catalog + repo layout discovery)
   │            │
QE-Web/manual-testing.md  Gherkin → Step Defs → POM
   │            │
QE-Shared/bug-reporting.md  dry run → REAL RUN → self-heal (≤3)
   │            │
QE-Shared/test-charter.md   │
   └─────┬──────┘
         │
    Regression suggestion (Covered Flows overlap)
         │
    Save Product Context
    (product_context/{PRODUCT}/context.md — no secrets)
         │
    End-to-End Testing complete

QE-Web/roam-testing.md (card-free exploratory) and QE-Shared/qa-insights.md
(dashboard/digest/roi) sit outside this diagram — they don't take a Jira card, and
qa-insights doesn't touch Playwright at all. Both are driven by the toolkit rather than by
each other. Reach either one through /web-qa-agent's menu.

**Mobile has its own, much shorter track**, entered via /mobile-qa-agent: it's a thin
menu, not a phase pipeline, because QE-Mobile/automation.md and QE-Mobile/setup.md are
already fully self-contained (they load .env, fetch their own Jira card, and read/write
product context on their own). QE-Mobile/setup.md is a one-time scaffolder (same role as
QE-Shared/k6-framework-scaffold.md, but for a mobile app's BDD test stack instead of a
perf-test stack) — run it once on a repo with no existing Cucumber/Mobilewright setup, then
use QE-Mobile/automation.md for ongoing card-driven test authoring against what it
scaffolded. **Menu-pick only** — by deliberate design its own text explicitly instructs
against triggering from plain-English phrasing, the same as before this pack was
reorganized: running a full framework scaffold has a large blast radius (installs
dependencies, writes multiple config files) to fire from a loosely-matched natural-language
guess.

QE-Shared/trm-audit.md also sits outside the web diagram — same standing as
QE-Shared/impacted-tests.md (report-only, repo-agnostic, no Jira card, no MCP) except for
one difference: **menu-pick only**, reachable from /web-qa-agent, same reasoning as
QE-Mobile/setup.md above. It audits an existing BDD repo's page objects, step definitions,
and feature files against the three-layer Test Reuse Metrics framework (a
keyword-driven-dispatcher reuse style) and produces a file-and-line-level report plus a
migration plan — an optional follow-up step will apply the fixes if the user asks. Note
this framework is a distinct reuse strategy from what automation/mobile automation
generate — trm-audit measures a repo against its own TRM conventions, not against
qa-pack's. It is **web-only by deliberate design** — not offered from /mobile-qa-agent.
Like qa-toolkit.cjs, its own companion script (measure-reuse.cjs) does the actual file
parsing and violation detection deterministically — the procedure reads its JSON output
rather than re-opening every page/step/feature file itself.

## Procedure Catalog — One-Line Summary

| Procedure | File | Input | Output | MCP Needed |
|-------|------|-------|--------|------------|
| Web QA Agent | QE-Web-QA-Agent/SKILL.md (real skill) | Jira card ID or menu choice | Dispatches to the right web procedure | Atlassian |
| Mobile QA Agent | QE-Mobile-QA-Agent/SKILL.md (real skill) | Jira card ID or menu choice | Dispatches to the right mobile procedure | Atlassian |
| automation (web) | QE-Web/automation.md | Jira card ID | Reuse audit + Gherkin + Step Defs + POM + real run (reuse % reported) | Atlassian, Playwright |
| automation (mobile) | QE-Mobile/automation.md | Jira card ID | Reuse audit + mobile Gherkin + Step Defs + Screen POM + real device run (reuse % reported) | Atlassian, Mobile MCP, MobileWright/mobilecli |
| setup (mobile) | QE-Mobile/setup.md | Nothing (a repo to scaffold into) — no card needed | Cucumber.js + Mobilewright + living-documentation HTML reporter installed and wired into package.json, plus one real smoke feature/step file | None — pure file scaffolding + npx mobilewright doctor/local test run |
| manual-testing | QE-Web/manual-testing.md | Jira card ID + app URL | Execution report + bugs + charter | Atlassian, Playwright |
| ui-test-figma | QE-Web/ui-test-figma.md | Figma URL + app URL | UI mismatch report, Jira comment | Playwright (CLI+MCP), Figma (optional) |
| accessibility-testing | QE-Web/accessibility-testing.md | Full page URL + Jira card (optional) | WCAG 2.1 A/AA report + Jira bugs | Playwright (CLI+MCP), Atlassian |
| bug-reporting | QE-Shared/bug-reporting.md | Bug description | Bug filed on Jira card | Atlassian |
| test-charter | QE-Shared/test-charter.md | Execution report MD file | Charter MD + published to API | Playwright (login) |
| roam-testing | QE-Web/roam-testing.md | App URL, no card required | Roam report + optional bugs + charter | Playwright, Atlassian (optional) |
| qa-insights | QE-Shared/qa-insights.md | Nothing (reads all products) | Dashboard HTML / digest MD / ROI MD | None — pure toolkit |
| trm-audit | QE-Shared/trm-audit.md | Nothing (an existing BDD repo to audit) — no card needed | File-and-line TRM alignment report + migration plan, outputs/trm-alignment-report.md; applies fixes only if asked | None — pure static analysis |
| impacted-tests | QE-Shared/impacted-tests.md | Base branch/commit + changed files (or auto-detected) | Impacted-tests report | None |
| k6-framework-scaffold | QE-Shared/k6-framework-scaffold.md | Nothing (a repo to scaffold into) | k6 load-testing framework tree | None until the tester runs it |
| delete-files | QE-Shared/delete-files.md | Nothing | Cleans up outputs/ with user consent | None |

## God Nodes (highest connectivity — touch these carefully)

1. QE-Web/automation.md — 15 edges (Gherkin→StepDefs→POM chain, token tracking, Playwright MCP, locator memory, trust ratchet)
2. QE-Web/manual-testing.md — 15 edges (dispatches to ui-test-figma, bug-reporting, test-charter, risk-score, fingerprint, dup-bug)
3. qa-toolkit.cjs — 6 procedures call into it (web-qa-agent, automation, manual-testing, bug-reporting, roam-testing, qa-insights) — not a skill itself, but the single highest-fan-in file in the pack
4. QE-Web-QA-Agent/SKILL.md — dispatches every web-track path, owns the Phase 3 pipeline, cost estimate + trust status
5. QE-Shared/test-charter.md — reads execution report, publishes to Decision Record API; also used by roam-testing
6. QE-Web/ui-test-figma.md — Figma MCP preferred, Playwright CLI fallback

## Dispatch Map
/web-qa-agent (or legacy /qa-agent)
  Phase 1 / "manual test"    → QE-Web/manual-testing.md   (reads ui-test-figma → bug-reporting → test-charter inline)
  Phase 2 / "automate CARD"  → QE-Web/automation.md        (reuse audit → Gherkin → steps → POM → run + self-heal)
  Phase 3 / "full QA"        → manual-testing THEN automation (hints file reused) → End-to-End complete
  "ui test"                  → QE-Web/ui-test-figma.md     (standalone)
  "accessibility test"       → QE-Web/accessibility-testing.md (standalone, URL + optional Jira card)
  "file bug"                 → QE-Shared/bug-reporting.md  (standalone)
  "charter"                  → QE-Shared/test-charter.md   (standalone)
  "roam mode" / "explore"    → QE-Web/roam-testing.md      (standalone, no card)
  "dashboard"/"digest"/"roi" → QE-Shared/qa-insights.md    (standalone, no card)
  "impacted tests"           → QE-Shared/impacted-tests.md (standalone, no card)
  "scaffold k6"              → QE-Shared/k6-framework-scaffold.md (standalone, no card)
  /trm-audit menu pick       → QE-Shared/trm-audit.md      (menu-pick only, web-only)
  (post-run)                 → QE-Shared/delete-files.md   (cleanup)


/mobile-qa-agent
  "automate mobile CARD"     → QE-Mobile/automation.md     (reuse audit → mobile Gherkin → steps → Screen POM → device run + self-heal)
  setup menu pick            → QE-Mobile/setup.md          (menu-pick only — never inferred from plain English)
  "file bug" / "charter" / "digest" / "impacted tests" → the same QE-Shared/*.md files as above

**Input collection happens ONCE per track** — in web-qa-agent for the web track, or
directly inside QE-Mobile/automation.md / QE-Mobile/setup.md for the mobile track (they are
self-contained). A dispatched procedure receives its parameters in the invocation message
(card ID, URLs, flags) and reads secrets from .env — it must not re-ask for anything
already known.

## Playwright Usage Guide (token budget)

### Expensive (avoid unless needed)
browser_snapshot() — returns full DOM tree (10k+ tokens). Use only to read login form selectors.
browser_screenshot() without saving — returns base64 (3k+ tokens). Always save to file.

### Cheap — prefer these
npx playwright screenshot --browser chromium --full-page <url> <file.png> — 0 response tokens, saves to disk
browser_evaluate(targeted JS) — targeted selector query, small response
npx playwright screenshot --storage-state <auth.json> --full-page <url> <file.png> — with session

### Session save pattern (save once, reuse)
bash
# After MCP login, save session to disk:
browser_evaluate("() => JSON.stringify({ls: {...localStorage}, ss: {...sessionStorage}})")
# Write result to .playwright-session.json
# Later CLI screenshots use: --storage-state .playwright-session.json

## Token Tracking — OPTIONAL, canonical pattern (all procedures follow this)

Token tracking is **disabled by default** and must never break a run.

**Enablement check — run ONCE at skill start, silently:**
bash
[ -n "$QA_TRACKING_DIR" ] && [ -f "$QA_TRACKING_DIR/track_tokens.py" ] \
  && echo TRACKING_ENABLED || echo TRACKING_DISABLED
(QA_TRACKING_DIR comes from .env. If the variable is unset, the scripts are missing,
or any tracking command errors — **skip ALL tracking commands for the rest of the run
silently**. Never mention tracking to the user, never retry a failed tracking call.)

**When enabled** — silent background task. Replace CARD_ID with the actual card ID:
bash
PROJECT=$QA_TRACKING_DIR
MODEL=${QA_TRACKING_MODEL:-claude}


# Entry (before any work)
SNAP=$(python3 $PROJECT/context_snapshot.py --phase start) && \
python3 $PROJECT/track_tokens.py start --card CARD_ID $SNAP --model $MODEL


# After each phase (repeat per checkpoint, replacing PHASE_NAME)
SNAP=$(python3 $PROJECT/context_snapshot.py --phase PHASE_NAME) && \
python3 $PROJECT/track_tokens.py phase --card CARD_ID --name PHASE_NAME $SNAP


# Exit (after skill completes)
SNAP=$(python3 $PROJECT/context_snapshot.py --phase end) && \
python3 $PROJECT/track_tokens.py end --card CARD_ID $SNAP --model $MODEL && \
python3 $PROJECT/track_tokens.py report && \
python3 $PROJECT/track_tokens.py session

**Phase names by procedure:**
automation (web + mobile): start → jira_fetch → reuse_audit → gherkin_generation → step_definitions → pom_generation → test_run → end
manual-testing: start → jira_fetch → ui_testing → test_execution → end
ui-test-figma: start → login → comparison → end
accessibility-testing: start → login → a11y_checks → end
test-charter: start → end

**Tracking cache efficiency:**

The track_tokens.py report output includes cache_efficiency_pct — what percentage of input tokens were served from Anthropic's prompt cache rather than re-processed.

Also check token_usage_log.json for cache_read_input_tokens per phase to see exactly where cache hits occur.

Target: cache_efficiency_pct ≥ 70 after the first run on a given product.
First run will always be 0% (cold cache). Second and subsequent runs should cache the stable block (product context + skill instructions).

## Model Routing (optional)

QA_MODEL_ROUTING in .env controls how web-qa-agent responds to Jira issue type at Step 1c:

| Value | Behavior |
|-------|----------|
| unset or recommend (default) | web-qa-agent prints a one-line model-tier recommendation (Story/Feature/Epic → high-capability, Task/Bug/Sub-task → lighter model) after fetching the card, then continues on whatever model is already active. Portable — depends on no special tooling. |
| off | Skip the recommendation line entirely. |
| subagent (advanced, opt-in — not wired up by the shipped skills) | For Claude Code setups where phase dispatch runs through a subagent/Task-style tool that accepts a model parameter: adapt web-qa-agent's Step 4 dispatch to pass model: haiku for Task/Bug and the default model for Story/Feature. This is a pattern to wire into your own environment's actual subagent tool — qa-pack itself doesn't assume one exists, since not every Claude Code setup qa-pack installs into exposes the same dispatch mechanism. |

## Artifact Locations

| Artifact | Path |
|----------|------|
| Test execution report | outputs/test-execution-[CARD]-[date].md |
| Test charter | outputs/charters/[slug].md |
| Bug screenshots | outputs/screenshots/T-[N]-[status].png |
| Accessibility report | outputs/a11y-report-[slug]-[date].md |
| Accessibility baseline screenshot | outputs/screenshots/a11y-baseline-[slug].png |
| Auth session | .playwright-session.json (gitignored) |
| Secrets / environment | .env at repo root (gitignored) |
| Step catalog (reuse audit) | .claude/skills/QE-Web-QA-Agent/product_context/[PRODUCT]/step-catalog.md |
| Mobile step catalog (reuse audit) | .claude/skills/QE-Web-QA-Agent/product_context/[PRODUCT]/mobile-step-catalog.md |
| Automation hints | outputs/automation-hints-[CARD]-[date].md |
| Token analytics | ~/.claude/token_analytics.png |
| Knowledge graph | graphify-out/graph.html (open in browser) |
| Product QA context (shared by web + mobile) | .claude/skills/QE-Web-QA-Agent/product_context/[PRODUCT]/context.md |
| DOM fingerprint cache | .claude/skills/QE-Web-QA-Agent/product_context/[PRODUCT]/dom-fingerprints.json |
| Trust ratchet state | .claude/skills/QE-Web-QA-Agent/product_context/[PRODUCT]/trust.json (or trust.mobile.json) |
| Locator learnings | .claude/skills/QE-Web-QA-Agent/product_context/[PRODUCT]/locator-learnings.md |
| Archived Runs Log rows (compaction) | .claude/skills/QE-Web-QA-Agent/product_context/[PRODUCT]/history/runs-archive.md |
| Archived closed bugs (compaction) | .claude/skills/QE-Web-QA-Agent/product_context/[PRODUCT]/history/bugs-archive.md |
| Archived Environment Notes (compaction) | .claude/skills/QE-Web-QA-Agent/product_context/[PRODUCT]/history/environment-notes-archive.md |
| Roam session report | outputs/roam-report-[timestamp].md |
| Product health dashboard | outputs/dashboard.html |
| QA weekly digest | outputs/qa-weekly-digest-[date].md |
| Token-spend / ROI view | outputs/roi-report.md |
| Shared toolkit CLI | .claude/skills/QE-Web-QA-Agent/toolkit/qa-toolkit.cjs |
| Manual-testing coverage/scenario reference | .claude/skills/QE-Web/TEST_DESIGN_GUIDE.md |
| TRM alignment report | outputs/trm-alignment-report.md |
| TRM measurement script output (JSON + HTML, machine-generated) | outputs/trm/reuse-report.json, outputs/trm/reuse-report.html |
| TRM measurement script | .claude/skills/QE-Shared/measure-reuse.cjs |
| TRM framework reference | .claude/skills/QE-Shared/TRM_FRAMEWORK.md |