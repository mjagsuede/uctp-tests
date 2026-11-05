// Card 01 · TRN-01 · Register a taxpayer · integration tests: the API and the screen agree
// From charters/card-01-charter.json, nodes with status "Integration": I1 to I6.
// Each test uses BOTH sides: it calls the API (api) and drives the screen (page), then compares them.
import { test, expect, signIn, newMobile, messageUnder, api, AS_PROBE, ME } from '../../helpers/web';

const URL = '/api/v1/training/taxpayers';
const DUP_MSG = 'already registered for this tenant';

test.describe('TRN-01 Register a taxpayer (integration: API and screen)', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  async function openForm(page) {
    await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Home' }).click();
    await page.getByRole('button', { name: 'Create my data' }).click();
    await expect(page.getByRole('heading', { name: '1 — Create a taxpayer' })).toBeVisible();
  }

  test('I1 · AC-1, AC-2 · create "Ana Dela Cruz" with the API, see it on the screen', async ({ page, request }) => {
    const mobile = newMobile();
    const made = await api(request, 'POST', URL, { full_name: 'Ana Dela Cruz', mobile, email: 'rosa@example.com' });
    expect(made.status, JSON.stringify(made.body)).toBe(201);

    await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'My data' }).click();
    const row = page.getByRole('row', { name: new RegExp(mobile) });
    await expect(row.getByRole('cell')).toHaveText(['Ana Dela Cruz', mobile, 'rosa@example.com']);
  });

  test('I2 · AC-1, AC-3 · create "  Rosa Web  " on the screen, read "Rosa Web" from the API', async ({ page, request }) => {
    const mobile = newMobile();
    await openForm(page);
    await page.getByLabel('Full name', { exact: true }).fill('  Rosa Web  ');
    await page.getByLabel('Mobile (09XXXXXXXXX)').fill(mobile);
    await page.getByRole('button', { name: 'Create taxpayer' }).click();
    await expect(page.getByText('created — mobile')).toBeVisible();

    const list = await api(request, 'GET', URL);
    const row = (list.body || []).find((r: any) => r.mobile === mobile);
    expect(row, 'the API list has a row with this mobile').toBeTruthy();
    expect({ full_name: row.full_name, email: row.email, created_by: row.created_by })
      .toEqual({ full_name: 'Rosa Web', email: null, created_by: ME });
  });

  // I3 · the same broken input, sent to the API and typed on the screen: the messages must be the same words.
  const cases = [
    { what: 'name "A"', field: 'full_name', label: 'Full name', input: { full_name: 'A' } },
    { what: 'mobile "0917-123-4567"', field: 'mobile', label: 'Mobile (09XXXXXXXXX)', input: { mobile: '0917-123-4567' } },
    { what: 'email "rosa@examplecom"', field: 'email', label: 'Email (optional)', input: { email: 'rosa@examplecom' } },
  ];
  for (const c of cases) {
    test(`I3 · AC-5, AC-6, AC-8 · show the same message on the API and the screen for ${c.what}`, async ({ page, request }) => {
      const body = { full_name: 'Ana Dela Cruz', mobile: newMobile(), ...c.input };
      const fromApi = await api(request, 'POST', URL, body);
      expect(fromApi.status).toBe(422);
      const apiMessage = fromApi.body?.detail?.[c.field];
      expect(apiMessage, 'the API names the field').toBeTruthy();

      await openForm(page);
      await page.getByLabel('Full name', { exact: true }).fill(body.full_name);
      await page.getByLabel('Mobile (09XXXXXXXXX)').fill(body.mobile);
      if (body.email) await page.getByLabel('Email (optional)').fill(body.email);
      await page.getByRole('button', { name: 'Create taxpayer' }).click();
      await expect(messageUnder(page, c.label)).toHaveText(apiMessage);
    });
  }

  test('I4 · AC-5, AC-8 · accept on the screen what the API accepts ("Ñoño O\'Brien-Cruz Jr.", +639 mobile)', async ({ page }) => {
    const nine = newMobile().slice(2);
    await openForm(page);
    await page.getByLabel('Full name', { exact: true }).fill("Ñoño O'Brien-Cruz Jr.");
    await page.getByLabel('Mobile (09XXXXXXXXX)').fill(`+639${nine}`);
    await page.getByRole('button', { name: 'Create taxpayer' }).click();
    await expect(page.getByText('created — mobile')).toContainText(`Ñoño O'Brien-Cruz Jr. created — mobile 09${nine}.`);
  });

  test('I5 · AC-4 · refuse on the screen a mobile the API registered', async ({ page, request }) => {
    const mobile = newMobile();
    const made = await api(request, 'POST', URL, { full_name: 'Ana Dela Cruz', mobile });
    expect(made.status, JSON.stringify(made.body)).toBe(201);

    await openForm(page);
    await page.getByLabel('Full name', { exact: true }).fill('Ben Dela Cruz');
    await page.getByLabel('Mobile (09XXXXXXXXX)').fill(mobile);
    await page.getByRole('button', { name: 'Create taxpayer' }).click();
    await expect(messageUnder(page, 'Mobile (09XXXXXXXXX)')).toHaveText(DUP_MSG);
  });

  test('I6 · AC-7 · use the same name-tag on the screen and the API (a probe user\'s taxpayer stays hidden)', async ({ page, request }) => {
    const theirs = newMobile();
    const mine = newMobile();
    const made = await api(request, 'POST', URL, { full_name: 'Ana Dela Cruz', mobile: theirs }, AS_PROBE);
    expect(made.status, JSON.stringify(made.body)).toBe(201);
    const own = await api(request, 'POST', URL, { full_name: 'Ana Dela Cruz', mobile: mine });
    expect(own.status, JSON.stringify(own.body)).toBe(201);

    const nav = page.getByRole('navigation', { name: 'Main' });
    await nav.getByRole('link', { name: 'My data' }).click();
    await expect(page.getByRole('row', { name: new RegExp(mine) })).toBeVisible();      // the list has loaded
    await expect(page.getByRole('row', { name: new RegExp(theirs) })).toHaveCount(0);   // the other user's is not in it
  });
});
