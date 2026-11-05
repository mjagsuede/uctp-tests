# Our project rules: API tests

Paste this whole file into your prompt, under **RULES:**. It tells the AI how tests look in this project, so you don't have to.

- Write Playwright API tests in TypeScript, with the `request` fixture (no browser). One file per user story: `tests/api/<story-id>.spec.ts` (for example `trn-02.spec.ts`).
- Every file starts with:
  `import { test, expect } from '@playwright/test';`
  `import { api, newMobile, newPin, newReference, ME, AS_PROBE, NO_USER, AS_OTHER_CASE } from '../../helpers/api';`
- Our helper does the rest. Never write the site address, the name-tag or the headers in a test.
  - `api(request, method, path, body, headers)` calls the API and returns `{ status, body }`. Leave out `headers` for my own user.
  - `AS_PROBE` = the headers of another user. `NO_USER` = the headers without `X-User-ID`. `AS_OTHER_CASE` = my name-tag in other letter case. `ME` = my name-tag (to compare with `created_by`).
  - `newMobile()` (`09` + 9 digits; for `+639` use `'+639' + newMobile().slice(2)`), `newPin()`, `newReference()` make new data on every run. Never type a mobile, PIN or reference that must be new.
- Put the tests in one `test.describe('<story id> <story name> (API)', ...)`. Data that several tests need (for example "my taxpayer") is made once in `test.beforeAll`; if that fails, those tests show as Blocked.
- One `test(...)` per charter node, named `<id> · <AC> · <what the test does, with its data>`, the same as the charter line. Check the status code **and** the body with `expect`, exactly as the charter says.
- Never change an expected result to match what you think the system does. If one looks wrong, say so after the code.
- A list (`GET` without an id) returns a plain JSON array of rows.
- Use field names exactly as in the example responses in my story (`taxpayer_id`, `bill_id`, ...). No response has a plain `id`.
- Names (`full_name`) take only letters, spaces, `.` `-` `'` and Ñ. No digits in names.
- Reply with each file in its own code block, with the file name on the line above it. Then at most 3 short notes.

Example: one test from our project (`tests/api/trn-01.spec.ts`):

```ts
test('A1 · AC-1 · create a taxpayer using "Ana Dela Cruz" and a new mobile, no email', async ({ request }) => {
  const mobile = newMobile();
  const res = await api(request, 'POST', '/api/v1/training/taxpayers', { full_name: 'Ana Dela Cruz', mobile });
  expect(res.status, JSON.stringify(res.body)).toBe(201);
  expect(res.body).toMatchObject({ full_name: 'Ana Dela Cruz', mobile, email: null });
  expect(res.body.taxpayer_id).toBeTruthy();
});
```
