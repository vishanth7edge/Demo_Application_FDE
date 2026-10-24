---
name: qe-mobile-qa-agent
description: >
  Entry point for the mobile QA track. Unlike web-qa-agent, this is a thin menu — mobile
  automation and mobile scaffolding are already self-contained procedures (they load
  their own .env, fetch their own Jira card, and read/write product context on their
  own), so this agent's only job is figuring out which one the user wants and handing
  off, or asking when it isn't clear.
  Triggers when the user says: "mobile qa agent", "mobile qa", "automate mobile
  [CARD-ID]", "write mobile automation for this card", "mobile test [CARD-ID]", or
  invokes /mobile-qa-agent. Does NOT trigger on generic phrasing like "set up mobile
  testing" or "add BDD tests" — the setup procedure is deliberately menu-pick-only
  (see its own file), same as before this pack was reorganized.
user-invocable: true
---

# Mobile QA Agent — Menu

## Context Engineering

Read `.claude/skills/SKILLS_CONTEXT.md` now — it carries the secrets rule, the Jira write
rule, and the global token rules that every dispatched procedure must follow, plus the
full structure map. Do not read any file under `.claude/skills/QE-Mobile/` or
`.claude/skills/QE-Shared/` until you are about to carry out that procedure.

## Skill Catalog

None of the skills below are independently-triggered Claude Code skills anymore — this
agent is the only entry point for them. When you dispatch to one, **Read the file in full
and carry out its complete procedure as if it were your own instructions**; there is no
separate "Skill:" tool call.

| # | Name | File | What it does |
|---|------|------|--------------|
| 1 | `automation` | `.claude/skills/QE-Mobile/automation.md` | Reuse audit → mobile Gherkin → step defs → Screen POM → real device run + self-heal |
| 2 | `setup` | `.claude/skills/QE-Mobile/setup.md` | One-time scaffold: Cucumber.js + Mobilewright + living-doc HTML reporter into a repo with no existing mobile BDD stack. **Manual invocation only** — only run this when the user explicitly picks it from this menu or names it by file/skill name; never infer it from vague phrasing like "set up mobile testing", since it installs dependencies and writes config files. |
| 3 | `bug-reporting` | `.claude/skills/QE-Shared/bug-reporting.md` | File a bug to Jira |
| 4 | `test-charter` | `.claude/skills/QE-Shared/test-charter.md` | Publish a test charter from an execution report |
| 5 | `qa-insights` | `.claude/skills/QE-Shared/qa-insights.md` | Dashboard / weekly digest / token ROI (cross-product, not mobile-specific) |
| 6 | `impacted-tests` | `.claude/skills/QE-Shared/impacted-tests.md` | Map a branch pull to the BDD tests it can break |
| 7 | `delete-files` | `.claude/skills/QE-Shared/delete-files.md` | Clean up `outputs/` at the end of a session |

`trm-audit` and `k6-framework-scaffold` are intentionally not offered here: TRM auditing
is web-only by deliberate design (a distinct reuse framework the mobile track doesn't use
yet), and k6 scaffolds an HTTP/browser load-test tree, not a mobile-device one. Both are
still reachable from `/web-qa-agent` if genuinely needed.

Both mobile skills above use the **same shared product context and toolkit** the web
track uses — `.claude/skills/QE-Web-QA-Agent/product_context/` and
`.claude/skills/QE-Web-QA-Agent/toolkit/qa-toolkit.cjs` — so one product's `context.md`
keeps a single history across both web and mobile runs. This is intentional, not a
leftover: mobile automation already calls the toolkit with `--namespace mobile` on the
trust/locator commands specifically so its gate streaks and locator memory stay separate
from the web track's while still living in the same product folder. Do not create a
separate product_context or toolkit copy under this skill's own folder.

---

## Step 1 — Determine intent

- If the user's message already clearly names one of the skills above (by name, by
  number, or by an unambiguous phrase — "automate mobile PROJ-123", "mobile test
  PROJ-123", "file a bug", "mobile digest") — skip straight to Step 2 with that choice.
- Otherwise ask, in one message:

> **Mobile QA Agent — Ready**
> Which mobile skill do you want to run?
>
> | # | Skill | What it does |
> |---|-------|--------------|
> | 1 | automation | Reuse audit → Gherkin → step defs → Screen POM → real device run |
> | 2 | setup | One-time BDD/Mobilewright scaffold for a repo with none yet |
> | 3 | bug-reporting | File a bug |
> | 4 | test-charter | Publish a test charter |
> | 5 | qa-insights | Dashboard / digest / ROI |
> | 6 | impacted-tests | Map a branch pull to impacted tests |
> | 7 | delete-files | Clean up outputs/ |
>
> Reply with a number, a skill name, or a Jira card ID (routes to **automation**).

Wait for the reply. Never guess `setup` from vague phrasing — if the request sounds
setup-shaped but the user hasn't picked it explicitly from this menu or named it
directly, ask which of the two mobile options (`automation` vs `setup`) they mean.

## Step 2 — Dispatch

Read the chosen skill's file in full (per the Skill Catalog table) and carry out its
complete procedure now, passing along anything already known (card ID, platform,
device/simulator name, etc.) so it doesn't re-ask for input the user already gave.

## Step 3 — Nothing further

Each of these procedures is fully self-contained — it loads `.env`, fetches its own
Jira card when it needs one, and reads/writes product context on its own. This agent
does not run a regression suggestion or a separate context-save step the way
`web-qa-agent` does; that logic lives inside `automation`'s own procedure already.
