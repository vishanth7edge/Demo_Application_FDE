> **Note:** No longer an independently-triggered Claude Code skill. It's read and executed by `/mobile-qa-agent` when the user picks **automation** from its menu — the full procedure below still applies exactly as written.

# Mobile BDD Templates & Reference

> Load this file at the start of Phase 1 (Gherkin generation) and Phase 3 (POM), alongside
> `LOCATOR_PATTERNS.md` and `MOBILE_MCP_REFERENCE.md`.
> Contains the Gherkin format, step definition template, POM class template, platform-
> conditional step pattern, app-lifecycle steps, and permission-dialog handling.

---

## Gherkin Format Example

```gherkin
Feature: <feature title from card>

  Background: (optional — only if 2+ scenarios share the same Given)
    Given the app is launched fresh

  Rule: <business rule — taken verbatim from AC/COS>

    @android @ios
    Example: <Persona> as <role> <scenario description>
      Given <persona> is on the <screen name> screen
      When <persona> <action described as intent, not mechanics>
      Then <persona> should <observable outcome>

    @android
    Example: <Android-only variation — e.g. hardware back button behavior>
      Given ...
      When <persona> presses the hardware back button
      Then ...

    @ios
    Example: <iOS-only variation — e.g. swipe-back gesture>
      Given ...
      When <persona> swipes back from the left edge
      Then ...

    Scenario Outline: <persona> <flow description> with multiple <data type>
      Given <persona> is on the <screen name> screen
      When <persona> enters credentials "<username>" and "<password>"
      Then <persona> should see "<expected_message>"

      Examples:
        | persona | username        | password     | expected_message    |
        | John    | john@test.com   | Admin@1234   | Verification passed |
        | Maria   | maria@test.com  | Branch@1234  | Verification passed |
```

**Platform tags:** tag every `Example`/`Scenario` `@android`, `@ios`, or both, when the
underlying interaction differs (see `LOCATOR_PATTERNS.md` §7 hardware BACK). Untagged
scenarios run on whichever `--project` is active per the config's platform matrix.

---

## Step Definition Template

```javascript
const { Given, When, Then, Before, After } = require('@cucumber/cucumber');
const { faker } = require('@faker-js/faker');
const LoginScreen = require('../../Pages/Auth/login-screen.cjs');

let loginScreen;

// ── Unconditional Before — resolve platform + fresh app state ────────────────
Before(async function () {
  this.platform = this.config.platform; // 'android' | 'ios' — set once, reused by every
                                          // platform-conditional step in this run
});

// ── Steps ──────────────────────────────────────────────────────────────────

Given('{word} is on the {string} screen', async function (persona, screenName) {
  loginScreen = new LoginScreen(this.screen);
  await loginScreen.navigateTo(screenName);
});

When('{word} enters credentials {string} and {string}', async function (persona, username, password) {
  await loginScreen.fillCredentials(username, password);
});

Then('{word} should see {string}', async function (persona, expectedMessage) {
  await loginScreen.verifyMessage(expectedMessage);
});

// ── Platform-conditional step (see LOCATOR_PATTERNS.md §7) ───────────────────
When('{word} goes back', async function (persona) {
  if (this.platform === 'android') {
    await this.screen.pressButton('BACK');
  } else {
    await loginScreen.tapBackButton(); // POM method — POM decides the iOS-specific locator
  }
});

// ── App lifecycle steps — reusable across every feature ──────────────────────
Given('the app is launched fresh', async function () {
  await this.device.launchApp({ newInstance: true });
});

When('{word} backgrounds the app', async function (persona) {
  await this.screen.pressButton('HOME');
});

When('{word} resumes the app', async function (persona) {
  await this.device.launchApp(); // foregrounds an existing instance, does not cold-start
});

// ── Permission dialog handling — call after any step that may trigger one ────
When('the app requests permission', async function () {
  const elements = await this.device.listElementsOnScreen();
  const allowButton = elements.find(el => /allow|while using the app/i.test(el.text));
  if (allowButton) {
    await this.screen.getByText(/allow|while using the app/i).tap();
  }
  // No dialog present → no-op, don't fail the scenario over an OS dialog that didn't fire.
});
```

---

## POM Class Template

```javascript
const { expect } = require('@mobilewright/test');

class LoginScreen {
  /**
   * @param {import('@mobilewright/test').Screen} screen
   */
  constructor(screen) {
    this.screen = screen;

    // ── Locators (constructor ONLY — never inside methods) ───────────────
    // All locators confirmed via mobile_list_elements_on_screen on the live device
    // Priority: resource-id/accessibility-id → getByRole/getByLabel → getByText → getByType → coordinates
    this.usernameInput  = screen.getByTestId('login-username');
    this.passwordInput  = screen.getByTestId('login-password');
    this.submitButton   = screen.getByTestId('login-submit');
    this.errorMessage   = screen.getByTestId('login-error');
    this.backButton     = screen.getByTestId('nav-back-button'); // iOS-specific usage — see step def
  }

  // ── Navigation ───────────────────────────────────────────────────────

  async navigateTo(screenName) {
    // Screen reached via app navigation, not a URL — describe the path taken,
    // not just the destination, since there's no direct deep link by default.
    await this.screen.getByText(screenName).tap();
  }

  // ── Actions ──────────────────────────────────────────────────────────

  async fillCredentials(username, password) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.submitButton.tap();
  }

  async tapBackButton() {
    await this.backButton.tap();
  }

  // ── Assertions ───────────────────────────────────────────────────────

  async verifyMessage(expectedText) {
    await expect(this.screen.getByText(expectedText)).toBeVisible();
  }
}

module.exports = LoginScreen;
```

---

## Faker.js Patterns (same library, same discipline as the web `automation` skill)

```javascript
const { faker } = require('@faker-js/faker');

faker.string.alphanumeric(15)                             // random name
`test+${faker.string.alphanumeric(8)}@yourdomain.com`     // email
faker.number.int({ min: 1, max: 100 })
faker.date.future().toISOString().split('T')[0]           // 'YYYY-MM-DD'
```

Generate inside the method — never in the constructor or at module scope.

---

## App-Lifecycle Step Catalog (reuse these before writing a new lifecycle step)

| Step | Underlying call |
|---|---|
| `the app is launched fresh` | `mobile_launch_app` / `device.launchApp({ newInstance: true })` — cold start |
| `{word} backgrounds the app` | `screen.pressButton('HOME')` |
| `{word} resumes the app` | `device.launchApp()` (no `newInstance`) — foregrounds, doesn't cold-start (see `LOCATOR_PATTERNS.md` §10) |
| `the app is force-closed` | `mobile_terminate_app` |
| `the app requests permission` | dump screen, tap Allow/While-using if a system dialog is present, no-op otherwise |
| `{word} rotates the device to {string}` | `mobile_set_orientation` + re-dump per `LOCATOR_PATTERNS.md` §9 |
| `{word} opens the deep link {string}` | `mobile_open_url` |

---

## Quick Reference

| Content | Location |
|---------|----------|
| Business rule | `Rule:` in `.feature` |
| Platform-specific variation | `@android` / `@ios` tag on the `Example`/`Scenario` |
| Persona/role variation | `Example:` block |
| Same flow, different data | `Scenario Outline` + `Examples:` |
| Locators discovered | `mobile_list_elements_on_screen` on the live device |
| Locators written | POM constructor only |
| Actions | POM async methods |
| Assertions | POM `verify*` methods |
| Generated test data | `faker.js` — inside methods |
| Direct `screen.getByX()` calls in step files | ❌ Never — always go through POM methods |
| Hardcoded coordinates | ❌ Last resort only, see `LOCATOR_PATTERNS.md` |
| Hardcoded waits | ❌ Never — use `expect(...).toBeVisible()` |
| `import`/`export` | ❌ Use `require`/`module.exports` (CommonJS, matches the web skill's convention unless the repo's own discovered convention says otherwise) |
| Gate 1 skipped | ❌ Never — always confirm Gherkin before writing code |
| Gate 2 skipped | ❌ Never — always confirm step defs before writing POM |
