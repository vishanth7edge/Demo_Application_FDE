const { env } = require('../utils/env');

// Locators + actions only. NO expect() here — assertions live in step definitions.
class BasePage {
  constructor(page) {
    this.page = page;
  }

  async navigate(urlPath) {
    await this.page.goto(`${env.BASE_URL}${urlPath}`);
  }

  async waitForURL(pattern, timeout = 10_000) {
    await this.page.waitForURL(pattern, { timeout });
  }

  toast(text) {
    return this.page.locator('[data-testid="toast"], [role="alert"]').filter({ hasText: text });
  }

  async isVisible(locator, timeout = 5_000) {
    try {
      await locator.waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  }

  // Wait for in-flight page-load requests to settle before triggering a mocked
  // fetch; capped and non-fatal so a chatty page can't hang the scenario.
  async waitForNetworkSettled(timeout = 5_000) {
    await this.page.waitForLoadState('networkidle', { timeout }).catch(() => {});
  }
}

module.exports = { BasePage };
