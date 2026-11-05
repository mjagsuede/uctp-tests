import { defineConfig, devices } from '@playwright/test';
import { BASE_URL } from './config/environment';

// Three projects:
//   api      API tests written for Playwright (tests/api/*.spec.ts), no browser
//   chrome   web and integration tests in Google Chrome
//   firefox  web and integration tests in Firefox
// The runner (npm run runner) and npm run test:watch run: api once, then each browser.
//
// REPORT names the report folder: reports/web or reports/integration (CI sets it per job).
// PW_JSON_FILE and PW_OUTPUT_DIR are set by the runner, so each run keeps its own results.
const report = process.env.REPORT || 'web';
const jsonFile = process.env.PW_JSON_FILE;
const inCI = !!process.env.CI;

export default defineConfig({
  testDir: 'tests',
  fullyParallel: false,   // shared training site: one test at a time
  workers: 1,
  retries: 3,             // a test that passes on a retry is reported as FLAKY, not passed
  outputDir: process.env.PW_OUTPUT_DIR || 'test-results',
  reporter: jsonFile
    ? [['list'], ['json', { outputFile: jsonFile }]]
    : [
        ['list'],
        ['html', { open: 'never', outputFolder: `reports/${report}/html` }],
        ['json', { outputFile: `reports/${report}/results.json` }],   // read by scripts/summary.js
      ],
  use: {
    baseURL: BASE_URL,    // BASE_URL setting, else config/environment.js
    trace: jsonFile ? 'off' : 'retain-on-failure',
    // In tab mode (PW_TABS=1) helpers/web.ts takes the failure screenshot of the test's own tab.
    screenshot: process.env.PW_TABS === '1' ? 'off' : 'only-on-failure',
  },
  projects: [
    {
      name: 'api',
      testDir: 'tests/api',
      testMatch: /.*\.spec\.(ts|js|mjs)$/,
      // API tests never open a browser: a test here that asks for page/browser fails at once
      // (it connects to a closed port) instead of launching Chrome.
      use: { connectOptions: { wsEndpoint: 'ws://127.0.0.1:9/api-tests-use-request-not-page' } },
    },
    {
      name: 'chrome',
      testMatch: /(web|integration)[\\/].*\.spec\.(ts|js|mjs)$/,
      // Real Google Chrome on your computer; CI uses Playwright's Chromium (the same engine).
      use: { ...devices['Desktop Chrome'], ...(inCI ? {} : { channel: 'chrome' }) },
    },
    {
      name: 'firefox',
      testMatch: /(web|integration)[\\/].*\.spec\.(ts|js|mjs)$/,
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'edge',
      testMatch: /(web|integration)[\\/].*\.spec\.(ts|js|mjs)$/,
      use: { ...devices['Desktop Edge'], channel: 'msedge' },
    },
    {
      name: 'webkit',   // Safari's engine
      testMatch: /(web|integration)[\\/].*\.spec\.(ts|js|mjs)$/,
      use: { ...devices['Desktop Safari'] },
    },
  ],
});
