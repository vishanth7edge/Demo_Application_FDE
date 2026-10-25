# Facilitator guide: running the Buggy Store SBT session

> Facilitator only. Pair this with [`defect-answer-key.md`](defect-answer-key.md) (spoilers) and give
> participants only the [charter](session-test-charter.md), the [requirements](requirements.md) and
> the [checklist](../reference_doc/manual_test.md).

## What participants get, and what they must not

| Share                                                                                           | Keep private                                                                                                                                               |
| ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| App URL, `docs/session-test-charter.md`, `docs/requirements.md`, `reference_doc/manual_test.md` | `docs/defect-answer-key.md`, `docs/facilitator-guide.md`, `reference_doc/bug-reference.md`, `e2e/defects/`, `server/` and `src/` (source reveals the bugs) |

The simplest setup is that the facilitator runs the app and participants use their own browsers.
If participants must run it themselves, give them a copy of the repository **without** the private
files above (they can still build and run it).

## Before the session (15 minutes)

1. `npm install` (first time only), then `npm run db:reset`.
2. `npm start` (production build plus API on one command). Open http://localhost:5173 and sign in as
   both demo users.
3. Optional sanity check: `npm run test:e2e` should report **42 passed** in the baseline project and
   **33 expected failures** in the defects project (the report shows them as passed, marked
   "expected to fail").
4. Open `docs/defect-answer-key.md` on a second screen and print or share the charter.

**Remote or LAN participants:** run `npm run build`, then in two terminals `npm run start:api` and
`npm run start:web -- --host`. The UI is then reachable at `http://<your-ip>:5173`; the API stays on
loopback behind the proxy. Only do this on a trusted network: the app has deliberate session and
authentication flaws.

## Run of show (about 75 minutes)

| Time  | Activity                                                                                                         |
| ----- | ---------------------------------------------------------------------------------------------------------------- |
| 0–10  | Introduce SBT: charter, timebox, session notes, debrief. Walk through the requirements doc and the checklist.    |
| 10–15 | Everyone signs in, opens DevTools (Console and Network), and starts a session log.                               |
| 15–55 | **Session** (30–40 min). Participants pick 2–3 charter areas. Facilitator circulates and offers hints if needed. |
| 55–70 | **Debrief** using PROOF (Past, Results, Obstacles, Outlook, Feelings). Collect bug titles on a shared board.     |
| 70–75 | Reveal: compare found vs seeded (answer-key summary table). Discuss which techniques found what.                 |

Reset between groups with `npm run db:reset` (safe while the app is running; everyone is signed out).

## Live demonstrations you can trigger

| Scenario                     | How                                                                                               |
| ---------------------------- | ------------------------------------------------------------------------------------------------- |
| API down / network failure   | DevTools › Network › Offline, or stop the API (`Ctrl+C` in its terminal when run via `start:api`) |
| Slow network                 | DevTools › Network › throttling "Slow 4G"                                                         |
| Session expiry               | Restart the API with `SESSION_TTL_MINUTES=1 npm run start:api`, wait a minute, click anything     |
| Large dataset (316 products) | `npm run db:reset:large`, then `npm run db:reset` afterwards                                      |
| Watch API traffic            | The API terminal logs every request: `[api] GET /api/products?… 200 301ms`                        |
| Inspect the database         | Open `data/buggy-store.db` with any SQLite browser (read-only while the app runs)                 |

## Hint ladder (use the mildest hint that unblocks someone)

1. Point to a charter area: "Have you looked at what happens after a delete?"
2. Point to a technique: "Try the boundaries in the requirements table." "Compare two screens that
   show the same number." "Open a second tab."
3. Point to a tool: "Watch the Network tab while you type." "Try only the keyboard." "Shrink the
   window to phone width."
4. Point to a requirement ID: "Read LIST-5 again, then try the filters together."

Avoid naming the defect or its location.

## Scoring (optional)

- 1 point per reproduced defect matching an answer-key entry (match by symptom, not wording).
- +1 for a report that cites the requirement and includes evidence.
- +1 for identifying the cause class (validation, calculation, state/cache, API contract, layout,
  accessibility).
- Prizes for the most **hard** defects (BUG-003, BUG-007, BUG-026, BUG-029) and for the best-written
  report.

## After the session

- `npm run db:reset` to restore the dataset.
- Share the answer key only after the debrief, if at all.
- To show the defects "fixed" for a contrast demo, follow the **Fix** line of each entry; the
  defect tests then start failing as "unexpectedly passed", which shows how expected-failure tests
  guard known issues.
