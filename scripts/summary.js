// One small results file for the whole run: reports/summary.json.
// It joins the Playwright reports (reports/api, reports/web, reports/integration: results.json)
// into one row per test:
//   { id: "A4", kind: "api", test: "...", result: "PASS" | "FAIL" | "SKIPPED", why: "..." }
// You give this file to the AI to update your charter (prompts/update-charter-prompt.md).
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'reports');
const rows = [];

// Playwright JSON reports (api, web and integration)
function walk(suite, file, kind) {
  for (const spec of suite.specs || []) {
    for (const t of spec.tests || []) {
      const last = (t.results || []).slice(-1)[0] || {};
      const status = last.status === 'passed' ? 'PASS' : last.status === 'skipped' ? 'SKIPPED' : 'FAIL';
      const error = (last.errors || []).map(e => e.message || '').join(' ').replace(/\u001b\[[0-9;]*m/g, '');
      rows.push({ id: (spec.title.match(/^([A-Z]+\d+)/) || [])[1] || spec.title, kind, file: spec.file || file,
        test: spec.title, result: status, why: status === 'FAIL' ? error.replace(/\s+/g, ' ').slice(0, 400) : '' });
    }
  }
  for (const s of suite.suites || []) walk(s, s.file || file, kind);
}
for (const kind of ['api', 'web', 'integration']) {
  const f = path.join(dir, kind, 'results.json');
  if (!fs.existsSync(f)) continue;
  const report = JSON.parse(fs.readFileSync(f, 'utf8'));
  for (const s of report.suites || []) walk(s, s.file, kind);
}

const count = r => rows.filter(x => x.result === r).length;
const run = process.env.GITHUB_RUN_ID
  ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}` : 'local run';
const summary = { ranAt: new Date().toISOString(), run, passed: count('PASS'), failed: count('FAIL'),
  skipped: count('SKIPPED'), results: rows };
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, 'summary.json'), JSON.stringify(summary, null, 2));
console.log(`${summary.passed} passed, ${summary.failed} failed, ${summary.skipped} skipped -> reports/summary.json`);

// On GitHub, also show a table on the run page.
if (process.env.GITHUB_STEP_SUMMARY) {
  const esc = s => String(s).replace(/\|/g, '\\|');
  const lines = [`## Test run: ${summary.passed} passed, ${summary.failed} failed`, '',
    '| Id | Kind | Test | Result | Why it failed |', '|---|---|---|---|---|',
    ...rows.map(r => `| ${r.id} | ${r.kind} | ${esc(r.test)} | ${r.result === 'PASS' ? '✅ PASS' : r.result === 'FAIL' ? '❌ FAIL' : r.result} | ${esc(r.why)} |`)];
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, lines.join('\n') + '\n');
}
