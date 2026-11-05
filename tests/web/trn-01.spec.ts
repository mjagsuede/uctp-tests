// Card 01 · TRN-01 · Register a taxpayer · web tests (the same story, on the screen)
// From charters/card-01-charter.json, nodes with status "UI journey": W1 to W9.
import { test, expect, signIn, newMobile, messageUnder } from '../../helpers/web';

const NAME_MSG = "2-100 characters: letters, spaces, . - ' and Ñ only";
const MOBILE_MSG = 'must be a PH mobile 09XXXXXXXXX or +639XXXXXXXXX';
const EMAIL_MSG = 'invalid email format';
const DUP_MSG = 'already registered for this tenant';

test.describe('TRN-01 Register a taxpayer (web)', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
    await page.getByRole('button', { name: 'Create my data' }).click();   // Home › Create my data
    await expect(page.getByRole('heading', { name: '1 — Create a taxpayer' })).toBeVisible();
  });

  test('W1 · AC-1 · open the Create a taxpayer form: all boxes empty, no result box', async ({ page }) => {
    await expect(page.getByLabel('Full name', { exact: true })).toHaveValue('');
    await expect(page.getByLabel('Mobile (09XXXXXXXXX)')).toHaveValue('');
    await expect(page.getByLabel('Email (optional)')).toHaveValue('');
    await expect(page.getByRole('button', { name: 'Create taxpayer' })).toBeVisible();
    await expect(page.getByText('created — mobile')).toBeHidden();      // no result box
  });

  test('W2 · AC-1 · create a taxpayer on the screen using "Ana Dela Cruz" and a new mobile', async ({ page }) => {
    const mobile = newMobile();
    await page.getByLabel('Full name', { exact: true }).fill('Ana Dela Cruz');
    await page.getByLabel('Mobile (09XXXXXXXXX)').fill(mobile);
    await page.getByRole('button', { name: 'Create taxpayer' }).click();
    await expect(page.getByText('created — mobile')).toContainText(`Ana Dela Cruz created — mobile ${mobile}.`);
  });

  test('W3 · AC-2 · see the new taxpayer "Ana Dela Cruz" in My data', async ({ page }) => {
    const mobile = newMobile();
    await page.getByLabel('Full name', { exact: true }).fill('Ana Dela Cruz');
    await page.getByLabel('Mobile (09XXXXXXXXX)').fill(mobile);
    await page.getByRole('button', { name: 'Create taxpayer' }).click();
    await expect(page.getByText('created — mobile')).toBeVisible();

    await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'My data' }).click();
    const row = page.getByRole('row', { name: new RegExp(mobile) });
    await expect(row.getByRole('cell')).toHaveText(['Ana Dela Cruz', mobile, '—']);
  });

  test('W4 · AC-3 · create a taxpayer using "  Rosa Web  ": shown as "Rosa Web"', async ({ page }) => {
    const mobile = newMobile();
    await page.getByLabel('Full name', { exact: true }).fill('  Rosa Web  ');
    await page.getByLabel('Mobile (09XXXXXXXXX)').fill(mobile);
    await page.getByRole('button', { name: 'Create taxpayer' }).click();
    await expect(page.getByText('created — mobile')).toContainText(`Rosa Web created — mobile ${mobile}.`);

    await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'My data' }).click();
    await expect(page.getByRole('row', { name: new RegExp(mobile) }).getByRole('cell').first()).toHaveText('Rosa Web');
  });

  test('W5 · AC-4 · refuse the same mobile twice on the screen ("Ben Dela Cruz" after "Ana Dela Cruz")', async ({ page }) => {
    const mobile = newMobile();
    await page.getByLabel('Full name', { exact: true }).fill('Ana Dela Cruz');
    await page.getByLabel('Mobile (09XXXXXXXXX)').fill(mobile);
    await page.getByRole('button', { name: 'Create taxpayer' }).click();
    await expect(page.getByText('created — mobile')).toBeVisible();

    await page.reload();                                                 // a clean form
    await page.getByLabel('Full name', { exact: true }).fill('Ben Dela Cruz');
    await page.getByLabel('Mobile (09XXXXXXXXX)').fill(mobile);
    await page.getByRole('button', { name: 'Create taxpayer' }).click();
    await expect(messageUnder(page, 'Mobile (09XXXXXXXXX)')).toHaveText(DUP_MSG);
  });

  test('W6 · AC-5 · refuse the full name "A" (1 letter) on the screen', async ({ page }) => {
    await page.getByLabel('Full name', { exact: true }).fill('A');
    await page.getByLabel('Mobile (09XXXXXXXXX)').fill(newMobile());
    await page.getByRole('button', { name: 'Create taxpayer' }).click();
    await expect(messageUnder(page, 'Full name')).toHaveText(NAME_MSG);
    await expect(page.getByText('created — mobile')).toBeHidden();
  });

  test('W7 · AC-6 · refuse the email "rosa@examplecom" (no dot after @) on the screen', async ({ page }) => {
    await page.getByLabel('Full name', { exact: true }).fill('Ana Dela Cruz');
    await page.getByLabel('Mobile (09XXXXXXXXX)').fill(newMobile());
    await page.getByLabel('Email (optional)').fill('rosa@examplecom');
    await page.getByRole('button', { name: 'Create taxpayer' }).click();
    await expect(messageUnder(page, 'Email (optional)')).toHaveText(EMAIL_MSG);
    await expect(page.getByText('created — mobile')).toBeHidden();
  });

  test('W8 · AC-8 · refuse the mobile 0917-123-4567 (dashes) on the screen', async ({ page }) => {
    await page.getByLabel('Full name', { exact: true }).fill('Ana Dela Cruz');
    await page.getByLabel('Mobile (09XXXXXXXXX)').fill('0917-123-4567');
    await page.getByRole('button', { name: 'Create taxpayer' }).click();
    await expect(messageUnder(page, 'Mobile (09XXXXXXXXX)')).toHaveText(MOBILE_MSG);
    await expect(page.getByText('created — mobile')).toBeHidden();
  });

  test('W9 · AC-7 · show nothing to another name-tag ("Probe") in My data', async ({ page }) => {
    const nav = page.getByRole('navigation', { name: 'Main' });
    await nav.getByRole('link', { name: 'Change' }).click();
    const dialog = page.getByRole('dialog', { name: 'Your name' });
    await dialog.getByRole('textbox').fill('Probe');                    // a new name gets new digits
    await Promise.all([page.waitForEvent('load'), dialog.getByRole('button', { name: 'Save' }).click()]);
    await expect(nav).toContainText('You are: Probe-');

    await nav.getByRole('link', { name: 'My data' }).click();
    await expect(page.getByText('None yet — create one in Training setup.').first()).toBeVisible();
  });
});
