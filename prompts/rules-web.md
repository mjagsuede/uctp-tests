# Our project rules: web tests

Paste this whole file into your prompt, under **RULES:**. It tells the AI how tests look in this project, so you don't have to.

- Write Playwright tests in TypeScript. One file per user story: `tests/web/<story-id>.spec.ts` (for example `trn-02.spec.ts`).
- Start the file like this:
  ```ts
  import { test, expect, signIn, newMobile, messageUnder } from '../../helpers/web';
  (`test` and `expect` come from `helpers/web`, not from '@playwright/test': in a headed run each test then opens a tab in one browser window.)
  ```
- Our helper does the rest. Never write the site address or the name-tag in a test.
  - `await signIn(page)` opens the site and signs in with my name-tag; you are then on **Home**. Call it in `test.beforeEach`. On a first visit the site shows a "Your name" dialog that blocks the page until it is filled in; `signIn` fills it in. Never `page.goto` a page without it.
  - `newMobile()` makes a new mobile on every run: `09` + 9 digits. For a `+639` mobile: `'+639' + newMobile().slice(2)`.
  - `messageUnder(page, '<field label>')` is the message under that field: `await expect(messageUnder(page, 'Mobile (09XXXXXXXXX)')).toHaveText('...')`.
- Open pages the way a clerk does: click the buttons and links. Only `signIn` uses a URL.
- The charter's Steps say what each thing is: `button "Create taxpayer"` → `getByRole('button', { name: 'Create taxpayer' })`; `link "My data"` → `getByRole('link', { name: 'My data' })`. A `top bar link` is inside `getByRole('navigation', { name: 'Main' })`.
- One `test(...)` per charter node, named `<id> · <AC> · <what the test does, with its data>`, the same as the charter line: `test('W3 · AC-2 · see the new taxpayer "Ana Dela Cruz" in My data', ...)`. Each test makes its own data.
- Find things the way a person sees them: `getByRole`, `getByLabel`, `getByText`, with the exact texts from the charter.
- Check with `expect(...)`. Never wait a fixed time (no `waitForTimeout`).
- Never change an expected text to match what you think the screen shows. If one looks wrong, say so after the code.
- Reply with the file in one code block, with the file name on the line above it. Then at most 3 short notes.

Example: one test from our project (`tests/web/trn-01.spec.ts`):

```ts
test('W8 · AC-8 · refuse the mobile 0917-123-4567 (dashes) on the screen', async ({ page }) => {
  await page.getByLabel('Full name', { exact: true }).fill('Ana Dela Cruz');
  await page.getByLabel('Mobile (09XXXXXXXXX)').fill('0917-123-4567');
  await page.getByRole('button', { name: 'Create taxpayer' }).click();
  await expect(messageUnder(page, 'Mobile (09XXXXXXXXX)')).toHaveText('must be a PH mobile 09XXXXXXXXX or +639XXXXXXXXX');
  await expect(page.getByText('created — mobile')).toBeHidden();      // no result box
});
```
