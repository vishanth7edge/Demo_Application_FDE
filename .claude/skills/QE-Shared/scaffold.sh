#!/usr/bin/env bash
# k6-framework-scaffold — create a ready-to-use k6 load-testing framework in the CURRENT repo.
# Usage:  bash .claude/skills/QE-Shared/scaffold.sh [--force]
#   (no flag) aborts if k6-performance-tests/ already exists.
#   --force   scaffolds into an existing folder; still never overwrites an existing file.
set -euo pipefail

ROOT="k6-performance-tests"
FORCE="${1:-}"

if [ -d "$ROOT" ] && [ "$FORCE" != "--force" ]; then
  echo "ERROR: $ROOT/ already exists. Re-run with --force to add only missing files." >&2
  exit 1
fi

# w <relative-path> : write heredoc (stdin) to $ROOT/<path>, only if the file doesn't exist.
w() {
  local path="$1"
  if [ -f "$ROOT/$path" ]; then echo "  skip (exists): $path"; cat >/dev/null; return; fi
  mkdir -p "$ROOT/$(dirname "$path")"
  cat > "$ROOT/$path"
  echo "  created: $path"
}

echo "Scaffolding $ROOT/ ..."

# ---------------------------------------------------------------- config/
w config/env.js <<'EOF'
// config/env.js — shared configuration. Fill these in for your app + environment.

export const BASE = 'https://api.example.com/v1'; // TODO: API base URL
export const UI_BASE = 'https://app.example.com'; // TODO: web-app URL (browser tests only)

export const PROJECT_ID = 0; // TODO: Grafana Cloud project id

// Target concurrency — the production peak you reproduce. Rescale by editing these numbers.
export const CONCURRENT = { userTypeA: 100, userTypeB: 100 };
export const TOTAL = {
  userTypeAVUs: CONCURRENT.userTypeA,
  userTypeBVUs: CONCURRENT.userTypeB,
  totalVUs: CONCURRENT.userTypeA + CONCURRENT.userTypeB,
};

// Credentials + ids used by auth and parameterised endpoints.
export const CREDS = { username: 'TODO', password: 'TODO', otp: '000000' };
export const TEST_DATA = { sampleId: 'TODO' };

// Include mutating (write) endpoints in the mix? They modify real data on the target env.
export const ENABLE_WRITES = false;

// Long-lived auth token(s) live in secrets.js (rotate per run).
export { ACCESS_TOKEN } from './secrets.js';
EOF

w config/secrets.js <<'EOF'
// config/secrets.js — auth material, refreshed before each run.
// ⚠️ Keep production tokens OUT of version control. Use short-lived non-prod tokens.
export const ACCESS_TOKEN = 'Bearer TODO';
EOF

w config/profiles.js <<'EOF'
// config/profiles.js — reusable LOAD PROFILES (the "how much"). A test wires a flow to one.

export function loadProfile({ exec, target, rampUp = '2m', hold = '15m', rampDown = '2m', startVUs = 0 }) {
  return { executor: 'ramping-vus', exec, startVUs, stages: [
    { duration: rampUp, target }, { duration: hold, target }, { duration: rampDown, target: 0 },
  ] };
}
export function arrivalRateProfile({ exec, rate, timeUnit = '1m', duration = '15m', preAllocatedVUs = 50, maxVUs = 100 }) {
  return { executor: 'constant-arrival-rate', exec, rate, timeUnit, duration, preAllocatedVUs, maxVUs };
}
export function spikeProfile({ exec, target, rampUp = '30s', hold = '1m', rampDown = '30s', startVUs = 0 }) {
  return { executor: 'ramping-vus', exec, startVUs, stages: [
    { duration: rampUp, target }, { duration: hold, target }, { duration: rampDown, target: 0 },
  ] };
}
export function breakpointProfile({ exec, maxRate, ramp = '30m', timeUnit = '1m', preAllocatedVUs = 50, maxVUs = 200 }) {
  return { executor: 'ramping-arrival-rate', exec, startRate: 0, timeUnit, preAllocatedVUs, maxVUs,
    stages: [{ duration: ramp, target: maxRate }] };
}
export function smokeProfile({ exec, vus = 1, iterations = 1 }) {
  return { executor: 'per-vu-iterations', exec, vus, iterations, maxDuration: '1m' };
}
export function enduranceProfile({ exec, target, rampUp = '2m', hold = '2h', rampDown = '2m', startVUs = 0 }) {
  return { executor: 'ramping-vus', exec, startVUs, stages: [
    { duration: rampUp, target }, { duration: hold, target }, { duration: rampDown, target: 0 },
  ] };
}
EOF

# ---------------------------------------------------------------- lib/
w lib/http.js <<'EOF'
// lib/http.js — shared request headers + response handling.
import { check } from 'k6';

// `token` is the full Bearer string. Each flow passes its own token.
export function authHeaders(token, extra = {}) {
  return { Authorization: token, 'Content-Type': 'application/json', ...extra };
}

// 2xx check; logs 4xx (client-side) with a short body snippet. 5xx tracked by error-rate metric.
export function checkResponse(res, name) {
  check(res, { [`${name} ok`]: (r) => r.status >= 200 && r.status < 300 });
  if (res.status >= 400 && res.status < 500) {
    const body = String(res.body || '').replace(/\s+/g, ' ').slice(0, 300);
    console.error(`FAIL ${name} | ${res.status} ${res.request.method} ${res.request.url} | ${body}`);
  }
  return res;
}
EOF

w lib/rand.js <<'EOF'
// lib/rand.js — deterministic pseudo-random for load distribution (NOT cryptographic; and
// intentionally not the JS built-in RNG, which trips security scans). Reproducible runs.

// xorshift32 -> fraction in [0,1). seed = any integer (e.g. the iteration index).
export function frac(seed) {
  let x = (seed >>> 0) || 1;
  x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0;
  return (x >>> 0) / 4294967296;
}

// Pick a weighted action given the total weight and a value u in [0,1).
export function weightedPick(actions, totalWeight, u) {
  const target = u * totalWeight; let acc = 0;
  for (let i = 0; i < actions.length; i++) { acc += actions[i].weight; if (target <= acc) return actions[i]; }
  return actions[actions.length - 1];
}
EOF

w lib/browser.js <<'EOF'
// lib/browser.js — checkpoints for browser/ (real-Chromium) tests.
import { check } from 'k6';

// Element visible within timeout ms (a "stuck UI" surfaces here as a timeout -> failure).
export async function expectVisible(page, selector, name, timeout = 10000) {
  let ok = false;
  try { await page.locator(selector).waitFor({ state: 'visible', timeout }); ok = true; } catch (e) { ok = false; }
  check(ok, { [`${name} visible`]: (v) => v === true });
  return ok;
}
// Element gone within timeout ms (e.g. a spinner cleared).
export async function expectHidden(page, selector, name, timeout = 15000) {
  let ok = false;
  try { await page.locator(selector).waitFor({ state: 'hidden', timeout }); ok = true; } catch (e) { ok = false; }
  check(ok, { [`${name} settled`]: (v) => v === true });
  return ok;
}
// Best-effort screenshot (never fails the iteration).
export async function shot(page, path) { try { await page.screenshot({ path }); } catch (e) {} }
EOF

# ---------------------------------------------------------------- protocol/api/
w protocol/api/exampleUser/auth.js <<'EOF'
// protocol/api/exampleUser/auth.js — token-issuing login. Adapt to your auth, or delete if
// you only use a pre-issued static token (config/secrets.js).
import http from 'k6/http';
import { BASE, CREDS } from '../../../config/env.js';
import { checkResponse } from '../../../lib/http.js';

const JSON_HEADERS = { 'Content-Type': 'application/json' };

// Example: POST /auth/sign-in -> returns a session (for a two-step OTP flow) or a token.
export function signIn(tags) {
  const res = http.post(`${BASE}/auth/sign-in`,
    JSON.stringify({ username: CREDS.username, password: CREDS.password }),
    { headers: JSON_HEADERS, tags: { name: 'auth-sign-in', ...tags } });
  checkResponse(res, 'auth-sign-in');
  try { return res.json('data.session'); } catch (e) { return null; }
}
// If login is two-step (OTP): read the session from signIn() and feed it into a verify() here.
EOF

w protocol/api/exampleUser/sample.js <<'EOF'
// protocol/api/exampleUser/sample.js — ENDPOINTS: one function per API call. Copy this shape
// for each endpoint (add a unique `name` tag so it shows per-endpoint in Grafana).
import http from 'k6/http';
import { BASE, TEST_DATA } from '../../../config/env.js';
import { authHeaders, checkResponse } from '../../../lib/http.js';

export function list(token, tags) {
  const res = http.get(`${BASE}/sample/list?page=1&limit=10`,
    { headers: authHeaders(token), tags: { name: 'sample-list', ...tags } });
  return checkResponse(res, 'sample-list');
}

export function get(token, tags) {
  const res = http.get(`${BASE}/sample/get/${TEST_DATA.sampleId}`,
    { headers: authHeaders(token), tags: { name: 'sample-get', ...tags } });
  return checkResponse(res, 'sample-get');
}

// ⚠️ WRITE example — mark write:true in the flow so ENABLE_WRITES can gate it.
// export function create(token, tags) {
//   const res = http.post(`${BASE}/sample`, JSON.stringify({ /* ... */ }),
//     { headers: authHeaders(token), tags: { name: 'sample-create', ...tags } });
//   return checkResponse(res, 'sample-create');
// }
EOF

# ---------------------------------------------------------------- protocol/flows/
w protocol/flows/exampleUserFlow.js <<'EOF'
// protocol/flows/exampleUserFlow.js — JOURNEY: a weighted API traffic-split for one user
// population. Each iteration a VU performs ONE weighted action; over the run the request mix
// converges to these proportions (= the client's feature-usage %).
import { sleep } from 'k6';
import exec from 'k6/execution';
import { ACCESS_TOKEN, ENABLE_WRITES } from '../../config/env.js';
import { frac, weightedPick } from '../../lib/rand.js';
import * as sample from '../api/exampleUser/sample.js';

// Pass/fail thresholds (from the client's SLA).
export const THRESHOLDS = {
  http_req_duration: ['p(95)<2000'], // TODO: SLA
  http_req_failed: ['rate<0.01'],
};

// weight = share of total traffic (sum ~ 1.0). write:true = mutating (gated by ENABLE_WRITES).
const ACTIONS = [
  { weight: 0.7, run: (t) => sample.list(t) },
  { weight: 0.3, run: (t) => sample.get(t) },
  // { weight: 0.1, write: true, run: (t) => sample.create(t) },
];
const ACTIVE = ENABLE_WRITES ? ACTIONS : ACTIONS.filter((a) => !a.write);
const TOTAL_WEIGHT = ACTIVE.reduce((s, a) => s + a.weight, 0);

export function exampleUserFlow() {
  const token = ACCESS_TOKEN;
  const seed = exec.scenario.iterationInTest + 1;
  weightedPick(ACTIVE, TOTAL_WEIGHT, frac(seed)).run(token);
  sleep(1 + frac(seed ^ 0x5bd1e995) * 2); // think time 1-3s
}
EOF

# ---------------------------------------------------------------- protocol/tests/
w protocol/tests/smoke/example.smoke.js <<'EOF'
// protocol/tests/smoke/example.smoke.js — quick "does it work?" before a big run.
import { PROJECT_ID } from '../../../config/env.js';
import { smokeProfile } from '../../../config/profiles.js';
import { THRESHOLDS } from '../../flows/exampleUserFlow.js';
export { exampleUserFlow } from '../../flows/exampleUserFlow.js';

export const options = {
  cloud: { projectID: PROJECT_ID, name: 'MyApp API — Smoke' },
  scenarios: { smoke: smokeProfile({ exec: 'exampleUserFlow', vus: 1, iterations: 1 }) },
  thresholds: THRESHOLDS,
};
EOF

w protocol/tests/load/example.load.js <<'EOF'
// protocol/tests/load/example.load.js — the expected-peak run.
import { PROJECT_ID, TOTAL } from '../../../config/env.js';
import { loadProfile } from '../../../config/profiles.js';
import { THRESHOLDS } from '../../flows/exampleUserFlow.js';
export { exampleUserFlow } from '../../flows/exampleUserFlow.js';

export const options = {
  cloud: { projectID: PROJECT_ID, name: 'MyApp API — Load' },
  scenarios: {
    users: loadProfile({ exec: 'exampleUserFlow', target: TOTAL.userTypeAVUs, hold: '15m' }),
  },
  thresholds: THRESHOLDS,
};
EOF

w protocol/tests/spike/README.md <<'EOF'
# Spike tests
Copy a load test here and swap the profile to `spikeProfile` (config/profiles.js) — a sudden
burst then a quick drop, to check the system survives/recovers from a surge.
EOF

w protocol/tests/breakpoint/README.md <<'EOF'
# Breakpoint tests
Ramp load upward until it breaks (find capacity). Use `breakpointProfile` and pair with an
`abortOnFail` threshold so the run stops at the breaking point.
EOF

w protocol/tests/endurance/README.md <<'EOF'
# Endurance (soak) tests
Moderate, sustained load for hours (memory leaks, resource growth). Use `enduranceProfile`.
EOF

# ---------------------------------------------------------------- browser/ (OPTIONAL)
w browser/pages/exampleApp/loginPage.js <<'EOF'
// browser/pages/exampleApp/loginPage.js — PAGE OBJECT (selectors + actions). Fill selectors
// from the real DOM/source. SPA-safe: wait on the next screen's element, not full navigation.
import { UI_BASE, CREDS } from '../../../config/env.js';

const SEL = {
  username: '#username',       // TODO
  password: '#password',       // TODO
  submit: '[data-testid="submit"]', // TODO
};

export async function login(page) {
  await page.goto(`${UI_BASE}/login`, { waitUntil: 'networkidle' });
  await page.locator(SEL.username).fill(CREDS.username);
  await page.locator(SEL.password).fill(CREDS.password);
  await page.locator(SEL.submit).click();
}
EOF

w browser/pages/exampleApp/samplePage.js <<'EOF'
// browser/pages/exampleApp/samplePage.js — checkpoints for a screen.
import { expectVisible } from '../../../lib/browser.js';
const SEL = { root: '[data-testid="page-root"]' }; // TODO
export async function assertLoaded(page) {
  return expectVisible(page, SEL.root, 'sample-page', 15000);
}
EOF

w browser/flows/exampleUiFlow.js <<'EOF'
// browser/flows/exampleUiFlow.js — UI JOURNEY (real browser): login -> a screen renders.
import { browser } from 'k6/browser';
import * as loginPage from '../pages/exampleApp/loginPage.js';
import * as samplePage from '../pages/exampleApp/samplePage.js';
import { shot } from '../../lib/browser.js';

export const UI_THRESHOLDS = {
  checks: ['rate>0.95'],
  browser_web_vital_lcp: ['p(90)<2500'], // TODO: tune to UX SLA
};

export async function exampleUiJourney() {
  const page = await browser.newPage();
  try {
    await loginPage.login(page);
    const ok = await samplePage.assertLoaded(page);
    await shot(page, `screenshots/example-${ok ? 'ok' : 'FAIL'}.png`);
  } finally {
    await page.close();
  }
}
EOF

w browser/tests/exampleUi.browser.js <<'EOF'
// browser/tests/exampleUi.browser.js — run a FEW real-browser VUs (each is a real Chromium,
// so keep counts small). Headless by default; K6_BROWSER_HEADLESS=false to watch locally.
import { PROJECT_ID } from '../../config/env.js';
import { UI_THRESHOLDS } from '../flows/exampleUiFlow.js';
export { exampleUiJourney } from '../flows/exampleUiFlow.js';

export const options = {
  cloud: { projectID: PROJECT_ID, name: 'MyApp UI — Example Journey (browser)' },
  scenarios: {
    ui: {
      executor: 'per-vu-iterations', exec: 'exampleUiJourney', vus: 1, iterations: 1,
      maxDuration: '3m', options: { browser: { type: 'chromium' } },
    },
  },
  thresholds: UI_THRESHOLDS,
};
EOF

# ---------------------------------------------------------------- root files
w .gitignore <<'EOF'
config/secrets.local.js
.env
*.k6-summary.json
summary.json
screenshots/
EOF

w README.md <<'EOF'
# k6 Performance & UX Test Framework

Two layers, sharing `config/` + `lib/`:
- **protocol/** — API / HTTP load (the CORE, every app). api/ (endpoints) -> flows/ (weighted
  traffic-split + thresholds) -> tests/ (wire a flow to a load profile).
- **browser/** — real-browser UX (OPTIONAL; UI-heavy apps only). Delete this folder if unneeded.

## Fill in
1. `config/env.js` — BASE / UI_BASE / PROJECT_ID / scale numbers / test data.
2. `config/secrets.js` — auth token(s) (keep out of VCS).
3. `protocol/api/**` — one function per real endpoint.
4. `protocol/flows/**` — weighted action table (feature-usage %) + thresholds (SLA).

## Run (from inside this folder)
```
k6 cloud login --token <GRAFANA_CLOUD_TOKEN>
k6 run       protocol/tests/smoke/example.smoke.js    # local sanity
k6 cloud run protocol/tests/load/example.load.js       # on Grafana Cloud
# browser (optional): k6 run browser/tests/exampleUi.browser.js
```
EOF

echo "Done. Structure created under $ROOT/"
echo "Next: fill config/env.js + config/secrets.js, then replace the example endpoints/flows."
