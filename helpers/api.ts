// Written once, used by every API test (and by the web and integration tests through helpers/web.ts):
// call the API as me or as another user, and make new test data on every run.
import type { APIRequestContext } from '@playwright/test';
import { ME, TENANT } from '../config/environment';

export { ME };
export const HEADERS = { 'Content-Type': 'application/json', 'X-Tenant-ID': TENANT, 'X-User-ID': ME };
export const AS_PROBE = { ...HEADERS, 'X-User-ID': `${ME}-probe` };              // my own second practice user
export const NO_USER = { 'Content-Type': 'application/json', 'X-Tenant-ID': TENANT };   // no X-User-ID
const OTHER_CASE = ME === ME.toLowerCase() ? ME.toUpperCase() : ME.toLowerCase();
export const AS_OTHER_CASE = { ...HEADERS, 'X-User-ID': OTHER_CASE };              // my name-tag in other letter case

// Call the API. Returns { status, body }. The site address comes from the Playwright config.
export async function api(request: APIRequestContext, method: string, path: string, body?: unknown,
  headers: Record<string, string> = HEADERS): Promise<{ status: number; body: any }> {
  const res = await request.fetch(path, { method, headers, data: body === undefined ? undefined : body });
  let data: any = null;
  try { data = await res.json(); } catch { /* no JSON body */ }
  return { status: res.status(), body: data };
}

// New data on every run, so you never clash with yourself or a classmate.
let counter = 0;
export function newMobile(): string {                       // 09 + 9 digits, never the same twice
  counter += 1;
  return `09${String(Date.now()).slice(-8)}${counter % 10}`;
}
function digits(n: number): string {
  counter += 1;
  return (String(Date.now()) + String(counter % 10)).slice(-n);
}
export function newPin(): string {                           // property PIN NNN-NN-NNN-NNN-NNN
  const d = digits(13);
  return `7${d.slice(0, 2)}-${d.slice(2, 4)}-${d.slice(4, 7)}-${d.slice(7, 10)}-${d.slice(10, 13)}`;
}
export const newReference = (): string => `A${digits(2)}-${digits(9)}`;   // business or fee bill reference
