---
name: qa-insights
description: >
  Cross-product reporting — Product Health Dashboard, QA Weekly Digest, and Token-Spend/ROI
  view. All three are generated entirely by a deterministic script reading every product's
  context.md under product_context/ — there is no LLM synthesis step, so this skill costs
  next to nothing to run regardless of how many products or runs exist.
  Triggers when the user says: "qa dashboard", "show product health", "weekly digest",
  "qa weekly report", "token roi", "token spend report", "automation ROI".
user-invocable: true
---

> **Note:** No longer an independently-triggered Claude Code skill and no longer has its own slash command. It's read and executed by `/web-qa-agent` or `/mobile-qa-agent` when the user picks **qa-insights** from its menu — the full procedure below still applies exactly as written.

# QA Insights — Dashboard / Digest / ROI

This skill is a thin wrapper. All three commands read `product_context/*/context.md`
tables (Runs Log, Known Bugs, Covered Flows) and, for ROI, the optional token tracker log —
the script does 100% of the aggregation. **Do not read any context.md file yourself before
or after calling the script** — that would recreate exactly the cost this skill exists to
avoid. Run the command, then report only its one-line result and the file path.

## Step 1 — Route on what was asked

| User said | Run |
|-----------|-----|
| "dashboard", "product health", "how are we doing across products" | `dashboard` |
| "weekly digest", "qa weekly report", "what happened this week" | `digest` (default 7 days — parse a different window if the user names one, e.g. "last 30 days" → `--days 30`) |
| "roi", "token spend", "automation roi", "cost per bug" | `roi` |
| Ambiguous / "insights" alone | Ask once: "Dashboard, weekly digest, or ROI view?" |

## Step 2 — Run it

```bash
node .claude/skills/QE-Web-QA-Agent/toolkit/qa-toolkit.cjs dashboard
node .claude/skills/QE-Web-QA-Agent/toolkit/qa-toolkit.cjs digest --days 7
node .claude/skills/QE-Web-QA-Agent/toolkit/qa-toolkit.cjs roi
```

- `NO_PRODUCTS` → tell the user plainly: "No products have completed a qa-agent run yet — nothing to report on." Stop, do not fabricate placeholder numbers.
- Any other output is already the final one-line summary — print it verbatim as your response, plus the file path it names. Do not add your own narrative summary on top of it.

## Other toolkit reports (same rules — run, print the output, don't re-read files)

| User said | Run |
|-----------|-----|
| "search qa history for X", "have we seen X before" | `qa-toolkit.cjs search --query "X" [--product P]` |
| "export runs/bugs to csv", "give me the bugs as json" | `qa-toolkit.cjs export --table runs\|bugs\|flows\|selectors [--format csv\|json] [--product P] [--out path]` |
| "is my setup ok", "qa doctor", "why won't qa run" | `qa-toolkit.cjs doctor` (exit 1 on any FAIL; `--json` for machines) |

## Step 3 — Offer to open it

**Headless runs** (the prompt came from `claude -p`, e.g. qa-pack Desktop, or says "no questions" / "non-interactive"): there is nobody to answer, so skip this step entirely and end with the one-line result.

For `dashboard` (an `.html` file), otherwise ask once: "Want me to note anything specific from it, or is the file enough?" Do not open/read the HTML back into context just to describe it — the file itself is the deliverable.

For `digest` and `roi` (`.md` files), the file is small enough that reading it back to quote one or two headline numbers in chat is fine if the user asks "what's in it" — but default to just pointing at the path unless asked.

---

## Error Handling

| Situation | Action |
|-----------|--------|
| `product_context/` doesn't exist at all | Same as `NO_PRODUCTS` — no qa-agent run has ever completed in this repo |
| `roi` reports token data unavailable | That's expected when `QA_TRACKING_DIR` isn't set — say so in one line, don't treat it as an error |
| User asks for a window `digest` doesn't support (e.g. "this quarter") | Convert to the nearest day count (`~90`) and say what you used |
