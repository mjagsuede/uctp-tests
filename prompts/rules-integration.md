# Our project rules: integration tests

Paste this whole file into your prompt, under **RULES:**. It tells the AI how integration tests look in this project.

An integration test checks that **the API and the screen agree**: it uses both in one test and compares them.

- Write Playwright tests in TypeScript. One file per user story: `tests/integration/<story-id>.spec.ts` (for example `trn-02.spec.ts`).
- Start the file like this:
  ```ts
  import { test, expect, signIn, newMobile, messageUnder, api, AS_PROBE, ME } from '../../helpers/web';
  (`test` and `expect` come from `helpers/web`, not from '@playwright/test': in a headed run each test then opens a tab in one browser window.)
  ```
- Our helper does the rest. Never write the site address, the name-tag or the headers in a test.
  - `await signIn(page)` opens the site and signs in with my name-tag; you are then on **Home**. Call it in `test.beforeEach`. On a first visit the site shows a "Your name" dialog that blocks the page until it is filled in; `signIn` fills it in. Never `page.goto` a page without it.
  - `await api(request, method, path, body)` calls the API as me and returns `{ status, body }`. Add `AS_PROBE` as the 5th argument to call it as another user. Get `request` from the test: `async ({ page, request }) => { ... }`.
  - `messageUnder(page, '<field label>')` is the message under that field on the screen. Use the field's whole label, exactly as the charter writes it (for example `Mobile (09XXXXXXXXX)`).
  - `newMobile()` makes a new mobile on every run: `09` + 9 digits. For a `+639` mobile: `'+639' + newMobile().slice(2)`. `ME` is my name-tag (to compare with `created_by`).
- One `test(...)` per charter node with the status "Integration", named `<id> · <AC> · <what the test does, with its data>`, the same as the charter line: `test('I1 · AC-1, AC-2 · create "Ana Dela Cruz" with the API, see it on the screen', ...)`.
- Every test uses **both** sides:
  - made by the API › check it on the screen, or
  - made on the screen › check it with the API, or
  - the same input to both › the same result and the same message on both.
- Find fields by their whole label from the charter: `getByLabel('Full name', { exact: true })`, `getByLabel('Mobile (09XXXXXXXXX)')`.
- Open pages the way a clerk does: click the buttons and links (`getByRole`, `getByLabel`, `getByText`). Only `signIn` uses a URL.
- Check with `expect(...)`. Never wait a fixed time (no `waitForTimeout`). Before you check that something is **not** on a page, first wait for something that **is** there.
- Never change an expected result to match what you think the system does. If one looks wrong, say so after the code.
- Use field names exactly as in the example responses in my story (`taxpayer_id`, `full_name`, `created_by`, ...).
- Reply with the file in one code block, with the file name on the line above it. Then at most 3 short notes.

Example: one test from our project (`tests/integration/trn-01.spec.ts`):

```ts
test('I1 · AC-1, AC-2 · create "Ana Dela Cruz" with the API, see it on the screen', async ({ page, request }) => {
  const mobile = newMobile();
  const made = await api(request, 'POST', '/api/v1/training/taxpayers',
    { full_name: 'Ana Dela Cruz', mobile, email: 'rosa@example.com' });
  expect(made.status, JSON.stringify(made.body)).toBe(201);

  await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'My data' }).click();
  const row = page.getByRole('row', { name: new RegExp(mobile) });
  await expect(row.getByRole('cell')).toHaveText(['Ana Dela Cruz', mobile, 'rosa@example.com']);
});
```
