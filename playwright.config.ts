import { defineConfig, devices } from '@playwright/test'

// The suite runs its own API + production build on separate ports and a separate database
// (data/e2e.db), so it never touches the demo data or a running `npm start`.
const API_PORT = '4100'
const WEB_PORT = '4174'
const E2E_DIST = 'node_modules/.e2e-dist'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  forbidOnly: process.env['CI'] !== undefined,
  retries: 0,
  timeout: 30_000,
  expect: { timeout: 5_000 },
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    ['json', { outputFile: 'test-results/results.json' }],
  ],
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    viewport: { width: 1366, height: 860 },
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'baseline',
      testDir: './e2e/baseline',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1366, height: 860 } },
    },
    {
      // Each test asserts the EXPECTED behaviour and is marked test.fail(): a seeded defect
      // makes it fail, which Playwright reports as an expected failure (the evidence).
      name: 'defects',
      testDir: './e2e/defects',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1366, height: 860 },
        screenshot: 'on',
      },
    },
  ],
  webServer: [
    {
      command: 'npx tsx server/index.ts',
      url: `http://127.0.0.1:${API_PORT}/api/health`,
      env: {
        API_PORT,
        DB_FILE: 'data/e2e.db',
        ENABLE_TEST_ROUTES: '1',
        API_LATENCY_MS: '150',
      },
      reuseExistingServer: false,
      stdout: 'ignore',
    },
    {
      command: `npx vite build --outDir ${E2E_DIST} --emptyOutDir && npx vite preview --outDir ${E2E_DIST} --port ${WEB_PORT} --strictPort`,
      url: `http://localhost:${WEB_PORT}`,
      env: { API_PORT },
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
})
