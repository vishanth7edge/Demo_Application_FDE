# Session-based test charter: Buggy Store

## Charter

|                    |                                                                                                                                                      |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Mission**        | Explore Buggy Store to assess the reliability of product management, input validation, navigation, data consistency, and session behaviour.          |
| **Duration**       | 30–45 minutes, uninterrupted, plus 10 minutes to debrief                                                                                             |
| **Application**    | http://localhost:5173 (your facilitator will confirm the address)                                                                                    |
| **Accounts**       | Administrator `admin@buggystore.test` / `Admin@123` · Viewer (read-only) `viewer@buggystore.test` / `Viewer@123`                                     |
| **Oracle**         | [`docs/requirements.md`](requirements.md): if the app disagrees with it, report it                                                                   |
| **Coverage model** | [`reference_doc/manual_test.md`](../reference_doc/manual_test.md): tick off the sections you touched                                                 |
| **Tools**          | Any desktop browser with DevTools (Console, Network, Application/Storage, device toolbar). A second browser and a screen reader are optional extras. |

## Before you start

1. Sign in once as the administrator and once as the viewer, to make sure both accounts work.
2. Open DevTools and keep the **Console** and **Network** tabs visible.
3. Start your session log (template below) and note the start time.
4. You may add, edit and delete products freely. The facilitator can reset the data at any time.

## Suggested exploration areas

Pick two or three areas for your session. Go deep rather than wide, and follow anything that looks
odd.

- **Authentication and forgotten passwords**: valid, invalid and unusual inputs; how you arrive at
  and leave the sign-in page.
- **Product creation and boundary values**: every field at, just inside and just outside its limits.
- **Search, sorting, filters and pagination**: alone, combined, and after the data changes.
- **Editing and deleting products**: do the right records change, and do other screens agree?
- **Dashboard calculations and data consistency**: can you prove each figure from the product list?
- **Browser navigation and session behaviour**: Back/Forward, refresh, typed URLs, several tabs.
- **Responsive layout and accessibility**: phone, tablet and desktop widths; keyboard only.
- **Error handling and the browser console**: what happens when the network or the server fails?

## Heuristics to try

- **Boundaries:** minimum, maximum, one below, one above, zero, empty.
- **Equivalence classes:** one representative from each valid and invalid group, including the
  less obvious valid ones.
- **Change one thing:** alter a single value and predict the effect on every other screen.
- **CRUD round trip:** create → read (list, details, dashboard) → update → delete → refresh.
- **Interrupt it:** double-click, cancel half-way, go Back, open a second tab, go offline.
- **Consistency:** the same fact shown in two places should agree.
- **Words, not just numbers:** spaces, punctuation, `& < > " '`, very long text, pasted text.

## Session log template

Copy this block for each session.

```text
SESSION LOG
-----------
Session ID:          SBT-<date>-<initials>-<n>
Tester:
Start time:          End time:          Duration:
Mission:             Explore Buggy Store to assess …
Charter areas:

Environment
  Browser / version:
  Screen size(s):
  Account(s) used:

Areas explored
  -

Tests and experiments performed (what you did → what you observed)
  -

Bugs found (title + bug report ID)
  -

Questions and risks (things that might be wrong, unclear requirements)
  -

Follow-up investigations (what you would test next with more time)
  -

Time split (rough %):  Testing __ | Bug investigation and reporting __ | Setup __
```

## Bug report template

```text
BUG REPORT
----------
ID:               <your initials>-<n>
Title:            <what is wrong> when <condition>
Requirement:      <e.g. LIST-5, or "not specified">
Environment:      Browser + version, OS, screen size, account/role, app URL
Preconditions:    State needed before step 1 (e.g. signed in as viewer, on page 2)

Steps to reproduce:
  1.
  2.
  3.

Expected result:
Actual result:

Severity:         Critical | High | Medium | Low
Reproducibility:  Always | Intermittent (x of y tries) | Once
Evidence:         Screenshot / screen recording / console log / network request (HAR or copy as cURL)
Notes:            Workarounds, related bugs, your guess at the cause
```

### Severity guide

| Severity | Use it when…                                                                           |
| -------- | -------------------------------------------------------------------------------------- |
| Critical | Data is lost or corrupted, or the wrong record is changed, with no warning             |
| High     | Wrong figures or data shown as correct, a security weakness, or a core task is blocked |
| Medium   | A feature misbehaves but a workaround exists, or a validation rule or message is wrong |
| Low      | Cosmetic or minor: wording, colour, alignment, small inconvenience                     |

## Debrief (10 minutes)

Each tester shares, in this order:

1. **Past:** what you did in the session.
2. **Results:** the bugs you found and the most interesting one.
3. **Obstacles:** what slowed you down (setup, unclear requirements, tools).
4. **Outlook:** what you would test next.
5. **Feelings:** how confident you are in the areas you covered.
