// Written once, used by every web and integration test: test and expect, sign in, read a field's message, call the API.
import { test as base, expect, chromium, type Page, type Locator, type BrowserContext } from '@playwright/test';
import { BASE_URL } from '../config/environment';
import { ME, api, HEADERS, AS_PROBE, newMobile } from './api';

export { ME, expect, api, HEADERS, AS_PROBE, newMobile };

// `test`: import it from here, not from '@playwright/test'.
// In a headed run from the runner or npm run test:watch (PW_TABS=1), each browser keeps ONE window
// and every test opens a new TAB in it. Tabs are never closed, so you can click through them after
// the run. Chrome's window belongs to the runner and stays open after the run (PW_CDP_CHROME).
// Each new tab starts clean: cookies, localStorage and sessionStorage are cleared first.
// Headless runs and CI: plain Playwright (a fresh context per test).
type TabsFixtures = { tabsContext: BrowserContext };
export const test = process.env.PW_TABS !== '1' ? base : base.extend<{}, TabsFixtures>({
  tabsContext: [async ({ browser, browserName }, use) => {
    const cdp = browserName === 'chromium' ? process.env.PW_CDP_CHROME : undefined;
    if (cdp) {
      const shared = await chromium.connectOverCDP(cdp);             // the runner's Chrome window
      await use(shared.contexts()[0]);
      await shared.close().catch(() => {});                          // disconnects only: the tabs stay
    } else {
      await use(await browser.newContext({ viewport: { width: 1280, height: 720 } }));   // one window for this browser
    }
  }, { scope: 'worker' }],
  context: async ({ tabsContext }, use) => { await use(tabsContext); },
  page: async ({ tabsContext }, use, testInfo) => {
    await tabsContext.clearCookies();
    const page = await tabsContext.newPage();
    await page.goto(BASE_URL);
    await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
    await use(page);
    // Screenshot of this test's tab when it fails (Playwright's own one would take every tab).
    if (testInfo.status !== testInfo.expectedStatus && !page.isClosed()) {
      const file = testInfo.outputPath('test-failed-1.png');
      try {
        await page.screenshot({ path: file });
        await testInfo.attach('screenshot', { path: file, contentType: 'image/png' });
      } catch { /* the tab is gone: no screenshot */ }
    }
    // never page.close(): the tab stays for the student to look at
  },
});

// The site asks "Your name" on the first visit. Typing your full name-tag
// (e.g. Ana-4821) continues your existing identity and data.
export async function signIn(page: Page, tag: string = ME) {
  await page.goto(new URL('/', BASE_URL).href);    // a full URL: works in a shared tab window too
  const dialog = page.getByRole('dialog', { name: 'Your name' });
  await dialog.getByRole('textbox').fill(tag);
  await Promise.all([                                   // Save reloads the page
    page.waitForEvent('load'),
    dialog.getByRole('button', { name: 'Save' }).click(),
  ]);
  await expect(page.getByRole('navigation', { name: 'Main' })).toContainText(`You are: ${tag}`);
}

// The message the screen shows under a field, found by the field's label:
// messageUnder(page, 'Mobile (09XXXXXXXXX)')
export function messageUnder(page: Page, label: string): Locator {
  return page.locator('.field', { has: page.getByLabel(label, { exact: true }) }).locator('.error');
}
