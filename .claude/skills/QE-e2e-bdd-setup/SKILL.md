---
name: qe-e2e-bdd-setup
description: Set up the Playwright + Cucumber (Gherkin BDD) + Page Object Model test infrastructure in a new repo, modeled on the tenant-application test/ folder. Setup only — does not write feature files or tests. Use when asked to "set up e2e/BDD tests" or bootstrap UI test automation for a new project.
trigger: /e2e-bdd-setup
---

# /e2e-bdd-setup

Sets up the **test infrastructure** in a new repo: a `test/` folder with Cucumber config, browser lifecycle hooks, world, base page object and env loader, plus the dependencies and npm scripts in the **repo-root** `package.json`.

**Scope: setup only.** Do NOT write feature files, step definitions, scenarios or app-specific page objects (other than the generic `LoginPage` stub the login hooks need). The user writes tests afterwards.

## Fixed decisions (do not deviate)

- **No `package.json`, `node_modules` or lockfile inside `test/`.** Dependencies and scripts go in the repo-root `package.json` (create one only if the repo has none; otherwise merge). Everything runs from the repo root.
- **No `.env` / `.env.example` / dotenv.** Configuration is read from the process environment (shell exports locally, pipeline variables in CI) via `test/utils/env.js`. Document the variables in `test/README.md` instead.
- **No `@blocked` tag / blocked-scenario tracking.** Cucumber config has no tag filter.

## Step 0 — Inspect the target repo (don't scaffold blind)

Read, then ask the user only for what you cannot infer:

1. Frontend dev/preview URL and API URL (`BASE_URL`, `API_URL`).
2. Auth model: password only, password + OTP, SSO? (Adapt `LoginPage` and the `@login-*` hooks.)
3. Existing root `package.json` (scripts, workspaces, ESM vs CJS), existing `test/` or `tests/` dir, CI system.
4. Whether the app uses `data-testid` (note for later; don't edit the app).

If a `test/` folder already exists, stop and ask. If the root `package.json` has `"type": "module"`, tell the user the templates are CommonJS and ask whether to rename them `.cjs` or convert.

## Step 1 — Scaffold

Copy `~/.claude/skills/e2e-bdd-setup/templates/` into `<repo>/test/`. Layout:

```
test/
├── cucumber.config.js        # shared base + `default` profile; per-module profiles added later
├── features/                 # empty (.gitkeep) — user writes feature files
├── step-definitions/         # empty (.gitkeep)
├── pages/BasePage.js         # shared helpers, no expect()
├── pages/LoginPage.js        # stub — adapt to the app's login
├── support/driver.js         # browser lifecycle, per-feature context, tag hooks, failure screenshots
├── support/world.js          # CustomWorld: this.page / this.context / this.state
├── data/users.js             # fixtures read from env
├── utils/env.js              # single env loader (process.env, no dotenv)
├── scripts/run-parallel.js   # runs profiles as parallel processes
├── reports/                  # generated, gitignored
└── README.md                 # write this: setup, env vars table, run commands, conventions
```

Then, in the **repo root**:

1. Add devDependencies: `@cucumber/cucumber`, `playwright`, `@playwright/test`, `@faker-js/faker`, `multiple-cucumber-html-reporter` (current versions; use the repo's package manager).
2. Add scripts (merge, don't clobber):
   ```json
   "test:e2e": "cucumber-js --config test/cucumber.config.js",
   "test:e2e:dry": "cucumber-js --config test/cucumber.config.js --dry-run",
   "test:e2e:parallel": "node test/scripts/run-parallel.js"
   ```
3. Append to `.gitignore`: `test/reports`, `test/.auth`, `test/support/traceDir`.
4. Write `test/README.md` with the env var table below, run commands, and the conventions section.

| Variable | Purpose | Default |
|---|---|---|
| `BASE_URL` | Frontend URL | `http://localhost:3000` |
| `API_URL` | Backend API URL | `http://localhost:3001` |
| `HEADLESS` | `true`/`false` | `true` |
| `SLOW_MO` | ms between actions | `0` |
| `TEST_USER_EMAIL` / `_PASSWORD` / `_OTP` | standard user | — |
| `TEST_ADMIN_EMAIL` / `_PASSWORD` / `_OTP` | admin user | — |

(Trim to what the app actually needs.)

## Step 2 — Verify

```bash
<pkg-manager> install
npx playwright install --with-deps chromium
npm run test:e2e:dry          # config + hooks load, no errors (zero scenarios is expected)
```

Also confirm Playwright can launch: `node -e "require('playwright').chromium.launch().then(b=>b.close())"`.
Report exactly what you observed. Don't claim a green test run — there are no tests yet.

## Conventions to document for whoever writes the tests

- Feature folders per module under `test/features/<module>/`, numeric prefix for order (`01_login.feature`); one profile per folder in `cucumber.config.js`.
- One feature = one flow; scenarios in a feature share the browser context and `this.state`; context is recreated per feature file.
- Page objects: locators + actions only, extend `BasePage`, **no `expect()`**. Assertions live in step definitions; steps call page-object methods only.
- Prefer `getByRole` / `getByTestId` / `getByText`. No sleeps — use Playwright auto-waiting.
- `{word}` actor in step text ("John logs in…") for readable Gherkin.
- Tag-driven fixtures in `driver.js` (`@login-admin`, `@login-standard`, `@Logout`); add a Before hook per new fixture rather than repeating login steps.
- UI-only: API helpers are for setup/teardown/seeding, not for asserting backend behavior.
- Mocks via `page.route()`; keep mock state at module level in the page object and register routes once per page.
- Unique test data (faker/uuid) and tagged cleanup so reruns and parallel runs don't collide.
- Credentials only through environment variables; never hardcode.

## Lessons from the source repo (mention in README where relevant)

- Shared accounts + parallel processes: cache `storageState` and guard creation with a cross-process lock (mkdir lock dir); check session liveness, don't infer it from file age.
- Remote environments can return transient 502/503/WAF HTML: retry only known transient signatures in setup/API calls, never assertions.
- Page-load requests can race with route mocks registered later: wait for network idle (capped, non-fatal) before the action that triggers the mocked fetch (`BasePage.waitForNetworkSettled`).

## CI (offer, don't add unasked)

One job per feature group running `node test/scripts/run-parallel.js <profiles>`; root `npm ci`, `npx playwright install --with-deps chromium`, build + serve the app and wait for the port; env vars from pipeline variables; always publish `test/reports` and traces.

## Report back to the user

What was scaffolded and where, assumptions made (URLs, auth), the exact dry-run/launch results, and TODOs (adapt `LoginPage`, set env vars, write the first feature).
