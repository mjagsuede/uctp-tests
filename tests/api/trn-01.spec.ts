// Card 01 · TRN-01 · Register a taxpayer · API tests
// From charters/card-01-charter.json, nodes with status "API test": A1 to A34.
import { test, expect } from '@playwright/test';
import { api, newMobile, ME, AS_PROBE, NO_USER, AS_OTHER_CASE } from '../../helpers/api';

const URL = '/api/v1/training/taxpayers';
const NAME_MSG = "2-100 characters: letters, spaces, . - ' and Ñ only";
const MOBILE_MSG = 'must be a PH mobile 09XXXXXXXXX or +639XXXXXXXXX';
const EMAIL_MSG = 'invalid email format';
const DUP_MSG = 'already registered for this tenant';
const NAME = 'Ana Dela Cruz';

test.describe('TRN-01 Register a taxpayer (API)', () => {
  // Setup: my own taxpayer, for the tests that read it back, hide it or register its mobile again.
  // If this fails, those tests show as Blocked.
  let mine: any;
  test.beforeAll(async ({ request }) => {
    const res = await api(request, 'POST', URL, { full_name: NAME, mobile: newMobile() });
    expect(res.status, `setup: create my taxpayer: ${JSON.stringify(res.body)}`).toBe(201);
    mine = res.body;
  });

  // One refused input: 422 and the exact message for that field.
  async function refused(request, body: object, field: string, msg: string) {
    const res = await api(request, 'POST', URL, body);
    expect(res.status, JSON.stringify(res.body)).toBe(422);
    expect(res.body?.detail?.[field]).toBe(msg);
  }

  // ---------- should work ----------
  test('A1 · AC-1 · create a taxpayer using "Ana Dela Cruz" and a new mobile, no email', async ({ request }) => {
    const mobile = newMobile();
    const res = await api(request, 'POST', URL, { full_name: NAME, mobile });
    expect(res.status, JSON.stringify(res.body)).toBe(201);
    expect(res.body).toMatchObject({ full_name: NAME, mobile, email: null });
    expect(res.body.taxpayer_id).toBeTruthy();
    expect(res.body.created_at).toBeTruthy();
  });

  test('A2 · AC-2 · read back the taxpayer from A1 by its taxpayer_id', async ({ request }) => {
    const res = await api(request, 'GET', `${URL}/${mine.taxpayer_id}`);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ taxpayer_id: mine.taxpayer_id, full_name: mine.full_name, mobile: mine.mobile,
      email: mine.email, created_at: mine.created_at });
  });

  test('A3 · AC-2 · find the taxpayer from A1 in my list (created_by = my name-tag)', async ({ request }) => {
    const res = await api(request, 'GET', URL);
    expect(res.status).toBe(200);
    const row = res.body.find(r => r.taxpayer_id === mine.taxpayer_id);
    expect(row).toMatchObject({ full_name: NAME, mobile: mine.mobile, created_by: ME });
  });

  test('A4 · AC-3 · create a taxpayer using "  Ana Dela Cruz  " (spaces around): saved as "Ana Dela Cruz"', async ({ request }) => {
    const res = await api(request, 'POST', URL, { full_name: '  Ana Dela Cruz  ', mobile: newMobile() });
    expect(res.status, JSON.stringify(res.body)).toBe(201);
    expect(res.body.full_name).toBe(NAME);
  });

  test('A5 · AC-5 · accept the full name "Al" (2 letters, the lower limit)', async ({ request }) => {
    const res = await api(request, 'POST', URL, { full_name: 'Al', mobile: newMobile() });
    expect(res.status, JSON.stringify(res.body)).toBe(201);
    expect(res.body.full_name).toBe('Al');
  });

  test('A6 · AC-5 · accept a full name of 100 letters (the upper limit)', async ({ request }) => {
    const res = await api(request, 'POST', URL, { full_name: 'A'.repeat(100), mobile: newMobile() });
    expect(res.status, JSON.stringify(res.body)).toBe(201);
    expect(res.body.full_name).toBe('A'.repeat(100));
  });

  test('A7 · AC-5 · accept the full name "Ñoño O\'Brien-Cruz Jr." (Ñ and . - \')', async ({ request }) => {
    const res = await api(request, 'POST', URL, { full_name: "Ñoño O'Brien-Cruz Jr.", mobile: newMobile() });
    expect(res.status, JSON.stringify(res.body)).toBe(201);
    expect(res.body.full_name).toBe("Ñoño O'Brien-Cruz Jr.");
  });

  test('A8 · AC-6 · accept a blank email "" (saved as null)', async ({ request }) => {
    const res = await api(request, 'POST', URL, { full_name: NAME, mobile: newMobile(), email: '' });
    expect(res.status, JSON.stringify(res.body)).toBe(201);
    expect(res.body.email).toBeNull();
  });

  test('A9 · AC-6 · accept the email "rosa@example.com"', async ({ request }) => {
    const res = await api(request, 'POST', URL, { full_name: NAME, mobile: newMobile(), email: 'rosa@example.com' });
    expect(res.status, JSON.stringify(res.body)).toBe(201);
    expect(res.body.email).toBe('rosa@example.com');
  });

  test('A10 · AC-6 · accept an email of 254 characters (the limit)', async ({ request }) => {
    const email = `${'a'.repeat(242)}@example.com`;
    const res = await api(request, 'POST', URL, { full_name: NAME, mobile: newMobile(), email });
    expect(res.status, JSON.stringify(res.body)).toBe(201);
    expect(res.body.email).toBe(email);
  });

  test('A11 · AC-8 · accept the mobile +639 + 9 digits (saved as 09 + the same 9 digits)', async ({ request }) => {
    const nine = newMobile().slice(2);
    const res = await api(request, 'POST', URL, { full_name: NAME, mobile: `+639${nine}` });
    expect(res.status, JSON.stringify(res.body)).toBe(201);
    expect(res.body.mobile).toBe(`09${nine}`);
  });

  // ---------- refused input ----------
  test('A12 · AC-5 · refuse the full name "A" (1 letter)', ({ request }) => refused(request, { full_name: 'A', mobile: newMobile() }, 'full_name', NAME_MSG));
  test('A13 · AC-5 · refuse the full name "  A  " (1 letter with spaces around)', ({ request }) => refused(request, { full_name: '  A  ', mobile: newMobile() }, 'full_name', NAME_MSG));
  test('A14 · AC-5 · refuse a full name of 101 letters (one too many)', ({ request }) => refused(request, { full_name: 'A'.repeat(101), mobile: newMobile() }, 'full_name', NAME_MSG));
  test('A15 · AC-5 · refuse the full name "Ana 2" (a digit)', ({ request }) => refused(request, { full_name: 'Ana 2', mobile: newMobile() }, 'full_name', NAME_MSG));
  test('A16 · AC-5 · refuse the full name "Ana@Cruz" (a symbol)', ({ request }) => refused(request, { full_name: 'Ana@Cruz', mobile: newMobile() }, 'full_name', NAME_MSG));
  test('A17 · AC-5 · refuse a blank full name ""', ({ request }) => refused(request, { full_name: '', mobile: newMobile() }, 'full_name', NAME_MSG));
  test('A18 · AC-8 · refuse the mobile 0917123456 (10 digits)', ({ request }) => refused(request, { full_name: NAME, mobile: '0917123456' }, 'mobile', MOBILE_MSG));
  test('A19 · AC-8 · refuse the mobile 091712345678 (12 digits)', ({ request }) => refused(request, { full_name: NAME, mobile: '091712345678' }, 'mobile', MOBILE_MSG));
  test('A20 · AC-8 · refuse the mobile "0917 123 4567" (spaces)', ({ request }) => refused(request, { full_name: NAME, mobile: '0917 123 4567' }, 'mobile', MOBILE_MSG));
  test('A21 · AC-8 · refuse the mobile 0917-123-4567 (dashes)', ({ request }) => refused(request, { full_name: NAME, mobile: '0917-123-4567' }, 'mobile', MOBILE_MSG));
  test('A22 · AC-8 · refuse the mobile 08171234567 (starts with 08)', ({ request }) => refused(request, { full_name: NAME, mobile: '08171234567' }, 'mobile', MOBILE_MSG));
  test('A23 · AC-8 · refuse the mobile +638171234567 (starts with +638)', ({ request }) => refused(request, { full_name: NAME, mobile: '+638171234567' }, 'mobile', MOBILE_MSG));
  test('A24 · AC-6 · refuse the email "rosa.example.com" (no @)', ({ request }) => refused(request, { full_name: NAME, mobile: newMobile(), email: 'rosa.example.com' }, 'email', EMAIL_MSG));
  test('A25 · AC-6 · refuse the email "rosa@@example.com" (two @)', ({ request }) => refused(request, { full_name: NAME, mobile: newMobile(), email: 'rosa@@example.com' }, 'email', EMAIL_MSG));
  test('A26 · AC-6 · refuse the email "rosa@examplecom" (no dot after @)', ({ request }) => refused(request, { full_name: NAME, mobile: newMobile(), email: 'rosa@examplecom' }, 'email', EMAIL_MSG));
  test('A27 · AC-6 · refuse an email of 255 characters (one too many)', ({ request }) => refused(request, { full_name: NAME, mobile: newMobile(), email: `${'a'.repeat(243)}@example.com` }, 'email', EMAIL_MSG));

  test('A28 · AC-4 · refuse a mobile I already registered (409)', async ({ request }) => {
    const res = await api(request, 'POST', URL, { full_name: 'Ben Dela Cruz', mobile: mine.mobile });
    expect(res.status, JSON.stringify(res.body)).toBe(409);
    expect(res.body?.detail?.mobile).toBe(DUP_MSG);
  });

  test('A29 · AC-4 · refuse a mobile I already registered, sent in +639 form (409)', async ({ request }) => {
    const res = await api(request, 'POST', URL, { full_name: 'Ben Dela Cruz', mobile: `+639${mine.mobile.slice(2)}` });
    expect(res.status, JSON.stringify(res.body)).toBe(409);
    expect(res.body?.detail?.mobile).toBe(DUP_MSG);
  });

  test('A30 · AC-5 · save nothing when the full name "A" is refused (the same mobile then works)', async ({ request }) => {
    const mobile = newMobile();
    const first = await api(request, 'POST', URL, { full_name: 'A', mobile });
    const second = await api(request, 'POST', URL, { full_name: NAME, mobile });
    expect({ first: first.status, second: second.status }).toEqual({ first: 422, second: 201 });
  });

  // ---------- who may see what ----------
  test('A31 · AC-7 · hide my taxpayer from another user (X-User-ID <me>-probe gets 404)', async ({ request }) => {
    const res = await api(request, 'GET', `${URL}/${mine.taxpayer_id}`, undefined, AS_PROBE);
    expect(res.status).toBe(404);
    expect(res.body?.detail).toBe('Not Found');
  });

  test('A32 · AC-7 · leave my taxpayer out of another user\'s list (X-User-ID <me>-probe)', async ({ request }) => {
    const res = await api(request, 'GET', URL, undefined, AS_PROBE);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.some(r => r.taxpayer_id === mine.taxpayer_id)).toBe(false);
  });

  test('A33 · AC-7 · treat my name-tag in other letter case as another user (404)', async ({ request }) => {
    const res = await api(request, 'GET', `${URL}/${mine.taxpayer_id}`, undefined, AS_OTHER_CASE);
    expect(res.status).toBe(404);
    expect(res.body?.detail).toBe('Not Found');
  });

  test('A34 · AC-7 · refuse a request with no X-User-ID header (422)', async ({ request }) => {
    const res = await api(request, 'GET', `${URL}/${mine.taxpayer_id}`, undefined, NO_USER);
    expect(res.status).toBe(422);
    expect(res.body?.detail?.['X-User-ID']).toBe('required header');
  });
});
