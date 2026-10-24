---
name: mobilewright-setup
description: >
  Scaffolds a complete BDD end-to-end test automation setup for a mobile app repo —
  Cucumber.js (Gherkin feature files + step definitions), Mobilewright (a
  Playwright-style device automation framework for iOS/Android, native or
  React Native/Expo), and a "living documentation" HTML report generator
  (multiple-cucumber-html-reporter). Works on any mobile app project: Expo,
  bare React Native, native iOS (UIKit/SwiftUI), or native Android
  (Views/Jetpack Compose) — it detects the project shape and adapts. Also use
  it as a reference when adding new feature files or step definitions to a
  project that already has this setup, so conventions stay consistent.
  MANUAL INVOCATION ONLY — do NOT trigger this skill from a plain-English request ("set up
  mobile testing", "add BDD tests", "set up mobilewright"), no matter how closely it matches
  this skill's purpose. Only invoke it when the user explicitly runs the `/mobilewright-setup`
  slash command. If a message sounds like it wants this skill but didn't use the command, tell
  the user to run `/mobilewright-setup` instead of invoking it yourself.
user-invocable: true
---

> **Note:** No longer an independently-triggered Claude Code skill. It's read and executed by `/mobile-qa-agent` when the user picks **setup** from its menu — the full procedure below still applies exactly as written.

# Mobile BDD Test Setup

Sets up a full BDD test-automation stack for a mobile app repo, end to end:
**Gherkin features → step definitions → Mobilewright device driver → Cucumber
JSON reports → an HTML "living documentation" report.** Everything is created
fresh in a single pass, adapted to whatever mobile project you're dropped into.

This skill does the scaffolding. It does not know the target app's screens —
budget time to explore the app's source (or a running build) to write the
first real feature/step files with correct locators.

## 0. Mental model

- **Cucumber.js** runs `.feature` files (Gherkin) against step definitions in
  `test/step-definitions/**/*.mjs`. It owns test discovery, execution, and
  JSON report output.
- **Mobilewright** (`mobilewright` npm package) is the device driver —
  Playwright's API (`getByRole`, `getByText`, `expect(...).toBeVisible()`,
  auto-waiting) but pointed at a real/emulated/simulated mobile device
  instead of a browser. One config file (`mobilewright.config.mjs`) declares
  which platform/device/app to drive; Cucumber's `World` uses it to launch
  the app before each scenario.
- **multiple-cucumber-html-reporter** turns the Cucumber JSON output into a
  browsable "living documentation" HTML report — this is the `report` /
  `living-doc.mjs` script.
- Nothing here is React-Native-specific. Mobilewright drives the OS
  accessibility tree, so this setup works for native iOS/Android apps too —
  only the locators change (see §6).

## 1. Discover the target project

Before writing anything, gather facts. Do this with direct reads/greps, not
guesses:

1. **Package manager & repo shape** — read `package.json`. Note the `name`
   and `version` (used later for report branding). Check for `expo` in
   dependencies (Expo/RN project) vs. presence of `ios/`/`android/` native
   folders only (bare RN or native project).
2. **Bundle / package identifier** — look in this order and stop at the
   first match:
   - `app.config.ts` / `app.config.js` / `app.json` (Expo) — read
     `ios.bundleIdentifier` and `android.package`. These are sometimes
     computed by a function (env-variant based, like a `getBundleIdentifier()`
     helper) rather than a plain string — if so, read the function to find
     the actual default value, don't just grab the string "getBundleIdentifier()".
   - `ios/*/Info.plist` → `CFBundleIdentifier`, or `*.xcodeproj` → `PRODUCT_BUNDLE_IDENTIFIER`.
   - `android/app/build.gradle` (or `.kts`) → `applicationId`.
   - If genuinely ambiguous (multiple variants/flavors: dev/qa/preprod/prod),
     ask the user which build variant to test against — don't silently pick one.
3. **Existing test setup** — check for `test/`, `e2e/`, `cucumber.js`,
   `*.feature` files, or an existing `mobilewright.config.*`. If any of this
   already exists, this is an **update**, not a fresh scaffold: read what's
   there and extend it rather than overwriting. Never blindly clobber an
   existing `mobilewright.config.*`, `cucumber.js`, or `world.mjs`.
4. **Testing platform** — infer if possible (e.g. only `android/` present →
   android; only `ios/` → ios). If both exist and the user didn't say, ask.

Only ask the user (via a clarifying question) for facts you could not
determine from the repo: target **platform** (`ios`/`android`), a
**device** to run against (a specific simulator/emulator name, or "use
auto-discovery"), and the **bundle/app id** if it's genuinely ambiguous.
Everything else, infer and proceed — this skill runs under an
auto/no-interruption workflow by default, so don't stop for things you can
reasonably derive.

## 2. Install dependencies

Detect the package manager from the lockfile present (`package-lock.json` →
npm, `yarn.lock` → yarn, `pnpm-lock.yaml` → pnpm, `bun.lockb` → bun) and
install as **devDependencies**:

```bash
npm install -D @cucumber/cucumber mobilewright multiple-cucumber-html-reporter
```

(swap `npm install -D` for the equivalent `yarn add -D` / `pnpm add -D` /
`bun add -d` as appropriate). Do not add these as runtime `dependencies`.

## 3. Create `mobilewright.config.mjs`

Write to the project root. Fill in the platform/bundleId/device values
discovered or confirmed in step 1 — never leave placeholder text in the
committed file.

```javascript
import { defineConfig } from 'mobilewright';

export default defineConfig({
  platform: '{{PLATFORM}}', // 'android' | 'ios'
  bundleId: '{{BUNDLE_ID}}', // e.g. com.example.myapp(.qa)
  deviceId: '{{DEVICE_ID}}', // named emulator/simulator profile, if the user gave one — omit this line if using auto-discovery instead
  deviceType: '{{DEVICE_TYPE}}', // 'emulator' | 'simulator' | 'real-device' — omit if unknown
  timeout: 30_000,
});
```

Notes:
- `deviceId`/`deviceType` are optional — Mobilewright auto-discovers the
  first booted device matching `platform` if omitted. Prefer auto-discovery
  unless the user specifically named a device/profile.
- If the project already targets both platforms via CI, consider the
  `projects` array (Mobilewright's multi-device/platform matrix — see the
  `projects` option in the mobilewright package's own `README.md` under
  `node_modules/mobilewright/README.md`, or https://mobilewright.dev) instead
  of a single flat config. Only do this if the user asks for multi-platform
  runs; default to a single flat config otherwise.
- A one-line comment noting *why* a value was picked (e.g. "QA build shared
  for testing") is fine and matches existing convention, but keep it to one
  line.

## 4. Create `cucumber.js`

Root-level Cucumber profile. This wires feature discovery, step import, and
report output:

```javascript
module.exports = {
  default: [
    'test/features/**/*.feature',
    '--import test/step-definitions/**/*.mjs',
    `--format json:reports/cucumber-report-${Date.now()}.json`,
    '--format summary',
    '--format progress-bar',
  ].join(' '),
};
```

Keep the feature/step-definition globs as-is unless the target repo already
uses a different test root (e.g. `e2e/` instead of `test/`) — match whatever
already exists rather than introducing a second convention.

## 5. Create `test/step-definitions/support/world.mjs`

This is the Cucumber `World` — it owns the device lifecycle (launch before
each scenario, close after). This file is intentionally app-agnostic; do not
add app-specific logic here.

```javascript
import { setWorldConstructor, setDefaultTimeout, Before, After } from '@cucumber/cucumber';
import { ios, android } from 'mobilewright';
import config from '../../../mobilewright.config.mjs';

setDefaultTimeout(config.timeout ?? 30_000);

class MobileWorld {
  async launch() {
    const launcher = config.platform === 'android' ? android : ios;
    this.device = await launcher.launch({
      bundleId: config.bundleId,
      deviceId: config.deviceId,
      deviceName: config.deviceName,
      installApps: config.installApps,
    });
    this.screen = this.device.screen;
  }

  async teardown() {
    await this.device?.close();
  }
}

setWorldConstructor(MobileWorld);

Before(async function () {
  await this.launch();
});

After(async function () {
  await this.teardown();
});
```

Every step definition gets `this.device` and `this.screen` from this World —
step files never construct their own device connection.

## 6. Write the first feature + step definitions

Don't hand-wave this — a setup with zero real assertions isn't done. Find one
real, stable entry point in the app under test and write one smoke scenario
against it:

1. **Find a locator.** Grep the app source for existing test hooks in
   priority order (this matches Mobilewright's own locator priority:
   `getByTestId` > `getByRole` > `getByLabel` > `getByText`):
   - React Native/Expo: search for `testID=`, `accessibilityLabel=`,
     `accessibilityRole=` props on the first/home screen's root and key
     interactive elements.
   - Native iOS: `accessibilityIdentifier` / `accessibilityLabel` in
     SwiftUI/UIKit source.
   - Native Android: `contentDescription` / view `id`s, or Compose
     `Modifier.testTag(...)` / `semantics { }`.
   - If nothing is tagged yet, don't invent testIDs blindly — either add a
     minimal `testID`/`accessibilityIdentifier` to the one element you need
     (small, targeted, and tell the user you did it), or fall back to
     `getByText('...')` against real on-screen copy you found in source.
2. **If you can run a booted simulator/emulator**, `npx mobilewright inspect`
   opens a live element inspector against the connected device — use it to
   confirm real locators instead of guessing from source alone.
3. Write `test/features/<area>.feature`:

```gherkin
Feature: <Screen or flow name>

  Scenario: <one concrete, observable outcome>
    Given <a starting state, e.g. "the app has launched">
    Then <an assertion tied to a real locator>
```

4. Write the matching `test/step-definitions/<area>.steps.mjs`:

```javascript
import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from 'mobilewright';

Given('the app has launched', async function () {
  await expect(this.screen.getByTestId('<real-test-id>')).toBeVisible();
});
```

Step conventions to follow:
- One `Given`/`When`/`Then` per file topic; keep step text reusable across
  scenarios in the same feature area rather than one-off phrasing per
  scenario.
- Prefer `getByTestId` / `getByRole` over `getByText`/coordinate taps —
  they're the least brittle across locale and copy changes.
- Never hardcode secrets (passwords, tokens) directly in `.feature` files if
  the repo has an env/secrets convention already (`.env`, CI variable
  groups, etc.) — follow that repo's existing pattern instead. If unsure, ask.

## 7. Create `scripts/living-doc.mjs`

Generates the browsable HTML report from the Cucumber JSON output. Pull
branding from `package.json` — never hardcode a project name:

```javascript
import { readFileSync } from 'fs';
import { generate } from 'multiple-cucumber-html-reporter';
import config from '../mobilewright.config.mjs';

const { name, version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url)));

const displayName = '{{DISPLAY_NAME}}'; // human-readable project name, e.g. derived from package.json `name`

generate({
  jsonDir: 'reports/',
  reportPath: 'living-documentation/',
  pageTitle: displayName,
  pageFooter: `<div class="created-by"><p>${displayName} QA</p></div>`,
  reportName: displayName,
  metadata: {
    device: config.deviceName ?? config.deviceId,
    platform: { name: config.platform === 'ios' ? 'iOS' : 'Android', version: '' },
    app: { name, version },
  },
  customData: {
    title: 'Run info',
    data: [{ label: 'Project', value: name }],
  },
});
```

Derive `displayName` from `package.json`'s `name` (title-cased, hyphens/
underscores replaced with spaces) unless the repo already has an obvious
human-readable product name elsewhere (README title, app display name in
`app.config.*`/`app.json`) — prefer that if present.

## 8. Wire up `package.json` scripts

Add (don't replace unrelated existing scripts):

```json
{
  "scripts": {
    "test": "cucumber-js",
    "test:doctor": "mobilewright doctor",
    "report": "node scripts/living-doc.mjs",
    "test:report": "npm run test && npm run report"
  }
}
```

If a `test` script already exists for a different test runner (unit tests,
etc.), don't clobber it — use a distinct name instead
(`test:e2e`/`test:bdd`/`test:mobile`) and say so to the user, then adjust
`test:report` to reference the new name.

## 9. Update `.gitignore`

Ensure generated test artifacts aren't committed. Add if missing:

```
# cucumber JSON reports + generated living documentation
reports
living-documentation

# test app binaries (built artifacts, not source)
test/app/
```

Only add the `test/app/` line if the repo's test setup installs app binaries
locally (check whether `installApps` is used in the config); skip it
otherwise.

## 10. Verify the environment

Run the doctor check and report its output to the user — don't just assume
success:

```bash
npx mobilewright doctor
```

This validates Xcode/Android SDK/emulator-simulator availability and tells
you exactly what's missing. Surface any failures verbatim; don't try to
silently work around a missing SDK/toolchain.

If a device is booted and reachable, also do a real run to confirm the
scaffold works end to end:

```bash
npm run test:report
```

## 11. Summary to the user

After setup, tell the user concretely:
- What was installed and created (file list).
- Which platform/device/bundle id the config targets, and why (inferred vs.
  user-provided).
- The doctor check result.
- How to run tests day to day: `npm test` (or the chosen script name),
  `npm run report` / `npm run test:report`, and where the living-doc report
  lands (`living-documentation/index.html`).
- That new features go in `test/features/*.feature` with matching
  `test/step-definitions/*.steps.mjs`, and that `world.mjs` under
  `test/step-definitions/support/` should stay app-agnostic — device
  lifecycle only, no scenario-specific logic.

## Reference

Full Mobilewright API (locators, assertions, config options, CLI commands)
is documented in the installed package at `node_modules/mobilewright/README.md`
and `node_modules/mobilewright/reference.md` once installed — read those
directly rather than relying on memory when writing non-trivial step
definitions (e.g. WebView bridging, multi-device `projects` config, role
mapping tables).
