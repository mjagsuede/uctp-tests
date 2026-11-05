// npm run test:watch -- the same run as Charter360's RUN button, from the terminal (no Charter360).
// API tests once, then web + integration tests in each browser from config/environment.js (headed),
// then the report in test-runs/<YYYY-MM-DD>/ (<SUT> - <date time>.html and .json), open it, commit and push.
//
//   npm run test:watch                                  newest charter in charters/
//   npm run test:watch -- charters/card-01-charter.json a chosen charter (for "Not tested")
//   HEADED=0 hides the browsers. NO_PUSH=1 skips the commit and push.
//   BROWSERS=chrome runs only these browsers. ONLY=A1,W3 runs only those test ids.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, loadEnvironment, runAll, closeHeldBrowsers, heldBrowserCount } from '../runner/lib.mjs';

const env = loadEnvironment();

function pickCharter(arg) {
  const dir = path.join(ROOT, 'charters');
  let file = arg ? path.resolve(arg) : null;
  if (!file && fs.existsSync(dir)) {
    file = fs.readdirSync(dir).filter(f => f.endsWith('.json') && f !== 'charter-starter.json')
      .map(f => path.join(dir, f)).sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)[0];
  }
  if (!file) return null;
  try { return { file, charter: JSON.parse(fs.readFileSync(file, 'utf8')) }; }
  catch (e) { console.error(`Can't read ${file}: ${e.message}`); process.exit(1); }
}

let lastStep = null;
const picked = pickCharter(process.argv[2]);
console.log(`Base URL: ${env.BASE_URL}`);
console.log(`Browsers: ${(process.env.BROWSERS || env.browsers.join(", "))}`);
console.log(`Charter:  ${picked ? path.relative(ROOT, picked.file) : '(none: "Not tested" stays empty)'}`);

const summary = await runAll({
  charter: picked?.charter || null,
  saveCharter: false,      // the charter file is already in charters/: don't write a copy
  baseUrl: env.BASE_URL,
  browsers: process.env.BROWSERS ? process.env.BROWSERS.split(',').map(b => b.trim()).filter(b => ['chrome', 'firefox'].includes(b)) : env.browsers,
  only: process.env.ONLY ? process.env.ONLY.split(',').map(s => s.trim()).filter(id => /^[AWI]\d{1,3}$/.test(id)) : undefined,
  headed: process.env.HEADED !== '0',
  push: process.env.NO_PUSH !== '1',
  open: process.env.NO_OPEN !== '1',
  onProgress: p => { if (p.step !== lastStep) { lastStep = p.step; console.log(`\n>>> ${p.message}`); } },
});

const c = summary.counts;
console.log(`\nTest run ${summary.run_id}: ${c.passed} passed, ${c.flaky} flaky, ${c.failed} failed, ${c.blocked} blocked, ${c.not_tested} not tested`);
console.log(`Report: ${path.join(summary.folder, summary.report)}`);
for (const m of summary.messages) console.log(m);
console.log(summary.push_message);

// Headed: the Chrome window (one tab per test) stays open until Ctrl+C.
if (heldBrowserCount()) {
  console.log('\nBrowsers stay open so you can look at each tab. Press Ctrl+C to close them.');
  await new Promise(resolve => { process.once('SIGINT', resolve); process.once('SIGTERM', resolve); });
  await closeHeldBrowsers();
}
process.exit(0);
