# TRM Framework Reference — Rule Definitions, Violations, Templates

> Load this file once at skill start. Never reload later in the same run — reference
> sections by number (e.g. "per §1 shared method rule") for the rest of the audit.

Test Reuse Metrics (TRM) is a three-layer measurement framework for a Playwright +
CucumberJS + BDD automation repo. It is a specific, opinionated architecture — a
**keyword-driven dispatcher** style, where most Gherkin steps route through a handful of
generic `{string}`-parameterized "master switch" steps rather than one bespoke step per
scenario. See "Relationship to other qa-pack skills" in `SKILL.md` before assuming this is
the same reuse style the `automation`/`mobile-automation` skills in this pack generate — it
isn't, and that's fine; TRM audits an existing repo against **its own** stated architecture,
it doesn't impose qa-pack's Gherkin conventions.

---

## §1 — Layer 1: POM Inheritance % (target: 100%)

**Check:** every file in the pages directory contains a class that extends `BasePage`.

**What belongs in `BasePage`** (generic, page-agnostic only):
- `navigateTo(path)` — generic navigation
- `waitForPageReady()` — generic load state wait
- `getCurrentUrl()` — generic URL getter
- `getTitle()` — generic title getter
- `verifyTextOnPage(text)` — generic text assertion. **Must use `window.__toastMessages`
  if the framework has a MutationObserver toast buffer — never assert on the live DOM node**
  (this is a global rule, restated here because it's the single most common Layer 1 mistake)
- `navigateToDashboard()` — generic dashboard navigation
- `click(locator)` / `fill(locator, value)` — generic action wrappers
- `heal(methodName, args, error)` — self-healing locator, only if `healer.cjs` exists in the repo

**What belongs in a page class** (only these):
- Locators, defined in the **constructor only** — never as class-field properties outside it
- Methods that combine those locators into page-specific actions

**The shared-method rule (the most important Layer 1 rule):**
- A method needed by only ONE page → stays in that page class
- A method needed by MORE THAN ONE page → must move to `BasePage`
- Scan all page classes for methods with identical or near-identical implementations across
  multiple pages and flag them for consolidation into `BasePage` — this is a cross-file
  check, not a per-file one; don't skip it just because each individual file looks fine.

**Violation examples:**
```javascript
// VIOLATION — generic goto in a page class (belongs in BasePage)
async goToPage(url) { await this.page.goto(url); }

// VIOLATION — hardcoded wait (never belongs anywhere, page or BasePage)
async waitForLoad() { await this.page.waitForTimeout(3000); }

// VIOLATION — page class not extending BasePage
class LoginPage { ... }  // missing extends BasePage

// VIOLATION — locator defined outside constructor
class LoginPage extends BasePage {
  emailInput = this.page.locator('#email');  // should be inside constructor
}
```

---

## §2 — Layer 2: Step Reuse % (target: 70–80%+)

**Check:** for every step definition, is it used in only 1 feature file (single-use)? Group
single-use steps by action type, then check whether a master switch step already exists for
that action type.

**The five master switch step patterns to check for and enforce:**

| Step Pattern | Action Type | Switch Key |
|---|---|---|
| `Given John is in the {string} page` | Navigation | page name |
| `When John enters the {string}` | Data entry | data type |
| `When John submits with the {string} button` | Button action | button type |
| `Then John should read a message stating {string}` | Toast assertion | none needed |
| `Then John confirms the {string}` | Confirmation | action type |

**Violation examples:**
```javascript
// VIOLATION — single-use navigation step (should be a case in master step 1)
Given('John is on the login page', async () => {
  await loginPage.navigateTo('/login');
});

// VIOLATION — single-use data entry step (should be a case in master step 2)
When('John enters his username and password', async () => {
  await loginPage.enterLoginCredentials(user, pass);
});

// VIOLATION — single-use button step (should be a case in master step 3)
When('John clicks the login button', async () => {
  await loginPage.clickLoginButton();
});

// VIOLATION — single-use toast assertion (should use master step 4)
Then('John should see a success message', async () => {
  await page.waitForSelector('.toast-success');
});

// CORRECT — dynamic switch step (master step 1)
Given('John is in the {string} page', async (pageName) => {
  switch (pageName) {
    case 'login':     await loginPage.navigateTo('/login'); break;
    case 'dashboard': await dashboardPage.navigateTo('/dashboard'); break;
    default: throw new Error(`Unknown page: "${pageName}"`);
  }
});
```

**Switch rule (if/else vs switch):**
- 2–3 conditions → if/else acceptable
- 4+ conditions → switch required
- Every switch MUST have a `default` that throws a descriptive error naming the switch file
  to update — this is a global rule (§5), restated here because Layer 2 is where it's
  checked most often.

---

## §3 — Layer 3: Feature:Step Ratio (trend only, no fixed target)

**Check:** ratio = (total non-empty lines across all `.feature` files) / (total
`Given`/`When`/`Then`/`And`/`But` registrations across all step-definition files). Compare
against the previous run's ratio (if known) and report improving/regressing — there is no
pass/fail threshold, only a trend direction.

**Gherkin format violations:**
```gherkin
# VIOLATION — Scenario keyword (should be Rule + Example)
Scenario: User logs in successfully

# VIOLATION — technical details in Gherkin
When John clicks the button with id="submit-btn"
And John waits for 3000ms
Then the DOM should contain ".dashboard-container"

# VIOLATION — hardcoded data instead of a dynamic parameter
When John enters "john@test.com" into the email field

# VIOLATION — single-use step pattern in Gherkin (not using master step 1)
Given John is on the login page

# CORRECT — Rule/Example format with dynamic master steps
Rule: User must be able to log in
  Example: Successful login
    Given John is in the "login" page
    When John enters the "login credentials"
    And John submits with the "login" button
    Then John should read a message stating "Login successfully."
```

---

## §4 — Master Switch File Template

Use this as the starting point when `commonSteps.cjs` (or equivalent) doesn't exist yet.
Fill in `case` entries from the single-use steps actually found during the audit — never
ship this with the placeholder cases below still in it.

```javascript
const { Given, When, Then } = require('@cucumber/cucumber');

// ── Master Switch 1 — Navigation ──────────────────────────────────────────
Given('John is in the {string} page', async function (pageName) {
  switch (pageName) {
    case 'login':     await this.loginPage.navigateTo('/login'); break;
    case 'dashboard': await this.dashboardPage.navigateTo('/dashboard'); break;
    // ... one case per navigation target found during the audit
    default: throw new Error(`Unknown page "${pageName}" — add a case to commonSteps.cjs`);
  }
});

// ── Master Switch 2 — Data entry ──────────────────────────────────────────
When('John enters the {string}', async function (dataType) {
  switch (dataType) {
    case 'login credentials': await this.loginPage.enterLoginCredentials(); break;
    // ... one case per data-entry action found during the audit
    default: throw new Error(`Unknown data type "${dataType}" — add a case to commonSteps.cjs`);
  }
});

// ── Master Switch 3 — Button actions ──────────────────────────────────────
When('John submits with the {string} button', async function (buttonType) {
  switch (buttonType) {
    case 'login': await this.loginPage.clickLoginButton(); break;
    // ... one case per button action found during the audit
    default: throw new Error(`Unknown button "${buttonType}" — add a case to commonSteps.cjs`);
  }
});

// ── Master Step 4 — Toast assertion (no switch needed) ────────────────────
Then('John should read a message stating {string}', async function (message) {
  await this.currentPage.verifyTextOnPage(message); // inherited from BasePage
});

// ── Master Switch 5 — Confirmation ────────────────────────────────────────
Then('John confirms the {string}', async function (actionType) {
  switch (actionType) {
    // ... one case per confirmation action found during the audit
    default: throw new Error(`Unknown confirmation "${actionType}" — add a case to commonSteps.cjs`);
  }
});
```

---

## §5 — Rules the Audit Must Always Enforce

1. Every page class must extend `BasePage` — no exceptions.
2. Locators are defined only in the constructor — never as class properties outside it.
3. No generic browser methods in page classes — they belong in `BasePage`.
4. New features = a new `case` in an existing switch — not a new step definition.
5. Gherkin uses `Rule`/`Example` keywords — never `Scenario`.
6. Toast assertions always use `Then John should read a message stating {string}`.
7. No technical details in Gherkin (no locator IDs, no `waitForTimeout`, no CSS selectors).
8. Every switch must have a `default` that throws a descriptive error naming the switch file
   to update.
9. The `{string}` parameter in Gherkin must be lowercase and consistent across feature files.
10. `verifyTextOnPage()` in `BasePage` must use `window.__toastMessages` if the framework has
    a MutationObserver toast buffer — never assert on the live DOM node.

---

## §6 — Key Terms

| Term | Definition |
|---|---|
| TRM | Test Reuse Metrics — three-layer measurement framework |
| Keyword Driven BDD | BDD pattern where Gherkin strings route to page actions via switch dispatchers |
| Master Switch | A step definition that uses switch-case to route to the correct page method |
| Layer 1 | POM Inheritance % |
| Layer 2 | Step Reuse % |
| Layer 3 | Feature:Step Ratio |
| Single-use step | A step definition used in only one feature file — the main driver of low Layer 2 % |
| Dynamic parameter | The `{string}` in Gherkin that the switch reads to route to the right page |
| BasePage | Superclass containing only generic browser methods valid on every page |
| Dispatcher | A step definition that routes to the correct page method via switch |
