const { chromium } = require('playwright');
const { BeforeAll, AfterAll, Before, After, setDefaultTimeout } = require('@cucumber/cucumber');
const fs = require('fs');
const path = require('path');
const { env } = require('../utils/env');
const { users } = require('../data/users');
const { CustomWorld } = require('./world');
const { LoginPage } = require('../pages/LoginPage');

setDefaultTimeout(120_000);

const shared = CustomWorld.shared;
const SCREENSHOT_DIR = path.join(__dirname, '..', 'reports', 'screenshots');
let browser;
let currentFeatureUri;

async function waitForServer(page, url, attempts = 30, delayMs = 2000) {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10_000 });
      if (res && res.status() < 500) return;
    } catch (err) {
      if (i === attempts - 1) throw new Error(`Server at ${url} not available after ${attempts} attempts: ${err.message}`);
    }
    await new Promise((r) => setTimeout(r, delayMs));
  }
}

async function newContext() {
  if (shared.context) await shared.context.close().catch(() => {});
  shared.context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  shared.page = await shared.context.newPage();
  shared.state = {};
  await shared.context.tracing.start({ screenshots: true, snapshots: true });
  await waitForServer(shared.page, env.BASE_URL);
}

BeforeAll(async function () {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  browser = await chromium.launch({ headless: env.HEADLESS, slowMo: env.SLOW_MO });
});

// New browser context whenever a new feature file starts (scenarios inside a feature share it).
Before(async function (scenario) {
  const uri = scenario.pickle.uri;
  if (uri !== currentFeatureUri) {
    currentFeatureUri = uri;
    await newContext();
  }
});

// ── Tag-driven fixtures ─────────────────────────────────────────────────────
// Add one hook per fixture instead of repeating login steps in Gherkin.
async function loginAs(user) {
  const login = new LoginPage(shared.page);
  await login.goto();
  await login.login(user.email, user.password, user.otp);
}

Before({ tags: '@login-admin' }, async function () { await loginAs(users.admin); });
Before({ tags: '@login-standard' }, async function () { await loginAs(users.standard); });

Before({ tags: '@Logout' }, async function () {
  await shared.context.clearCookies();
  await shared.page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); }).catch(() => {});
});

After(async function (scenario) {
  if (scenario.result?.status !== 'FAILED') return;
  const name = `${scenario.pickle.name.replace(/[^\w-]+/g, '_')}__${Date.now()}.png`;
  try {
    const buf = await shared.page.screenshot({ fullPage: true });
    this.attach(buf, 'image/png');
    fs.writeFileSync(path.join(SCREENSHOT_DIR, name), buf);
  } catch { /* page may already be closed */ }
});

AfterAll(async function () {
  if (shared.context) await shared.context.close().catch(() => {});
  if (browser) await browser.close();
});
