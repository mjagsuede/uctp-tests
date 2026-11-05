// Shared by the runner (runner/runner.mjs) and npm run test:watch (scripts/test-watch.mjs):
// one test run = save the charter, API tests once, web + integration tests in each browser,
// then one folder per run, test-runs/<YYYY-MM-DD>/<SUT> - <story ID and name> - <YYYY-MM-DD HHMMSS>/, holding that name's .html
// (the report), .json and the screenshots; refresh test-runs/index.html (the list GitHub Pages shows), open the report, commit and push.
//
// Only fixed commands run here (node + Playwright's CLI, git), always as argument arrays, never a shell.
import fs from 'node:fs';
import os from 'node:os';
import net from 'node:net';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const ALL_BROWSERS = ['chrome', 'firefox', 'edge', 'webkit'];
export const BROWSER_LABEL = { chrome: 'Chrome', firefox: 'Firefox', edge: 'Microsoft Edge', webkit: 'Safari (WebKit)' };
export const STAGING_HOST = 'city-treasurer-staging.aiqe.pro';

const require = createRequire(import.meta.url);
export function loadEnvironment(root = ROOT) {
  return require(path.join(root, 'config', 'environment.js'));
}

// ---------- small helpers ----------
const ANSI = /\u001b\[[0-9;]*[A-Za-z]/g;
export const stripAnsi = s => String(s ?? '').replace(ANSI, '');
const ID_RE = /^([AWI]\d+)(?!\d)/;
export const idOf = title => (ID_RE.exec(String(title || '').trim()) || [])[1] || '?';

export function newRunId(date = new Date(), root = ROOT) {
  const p = n => String(n).padStart(2, '0');
  const base = `${date.getFullYear()}${p(date.getMonth() + 1)}${p(date.getDate())}-${p(date.getHours())}${p(date.getMinutes())}${p(date.getSeconds())}`;
  let id = base;
  const day = path.join(root, 'test-runs', runDay(base));
  const used = i => fs.existsSync(day) && fs.readdirSync(day).some(f => f.includes(` - ${runDay(i)} ${runTime(i)}`));
  for (let n = 2; used(id); n++) id = `${base}-${n}`;
  return id;
}

// run_id "20261105-143000" -> day "2026-11-05", time "143000" (a "-2" suffix stays on the time)
export const runDay = id => `${id.slice(0, 4)}-${id.slice(4, 6)}-${id.slice(6, 8)}`;
export const runTime = id => id.slice(9);

// One line of text as a file-name part: no \ / : * ? " < > | or control characters, at most `max` long.
const filePart = (text, max = 60) => String(text || '').split('\n')[0].replace(/[\\/:*?"<>|\u0000-\u001f]+/g, '-')
  .replace(/\s+/g, ' ').trim().replace(/^[#.\s-]+|[.\s-]+$/g, '').slice(0, max).trim();

// The system under test (charter root) as a file-name part. Fallback "Tests".
export function sutName(charter) {
  return filePart(charterStory(charter)) || 'Tests';
}

// A story ID and its name: "Card 01 · TRN-01 · Register a taxpayer" -> "TRN-01", "Register a taxpayer".
// Not AC-1 (acceptance criteria) or names like UTF-8.
const STORY_RE = /(?:^|[^A-Za-z0-9-])((?!(?:AC|UTF|ISO|HTTP|SHA|TLS)-)[A-Z][A-Z0-9]{1,9}-\d{1,4})(?![\w-])[ \t]*(?:[·:|—–-][ \t]*)?([^\n·|]*)/;

// The user story for the run name, "TRN-01 Register a taxpayer": the first story ID found in the hints
// (Charter360 sends the map title and the story box's first line), the charter title, the root, its top-level
// nodes or a "Story…" node. Without an ID: the charter title, when it isn't the SUT. "" when there is nothing.
export function storyName(charter, hints = []) {
  const texts = [...hints].map(String);
  if (charter && typeof charter === 'object') {
    texts.push(String(charter.title || ''), String(charter.root?.text || ''));
    const top = Array.isArray(charter.root?.children) ? charter.root.children : [];
    for (const c of top) texts.push(String(c?.text || ''));
    (function walk(nodes) {
      for (const n of nodes || []) {
        if (/^\s*Story\b/i.test(String(n?.text || ''))) texts.push(String(n.text));
        if (Array.isArray(n?.children)) walk(n.children);
      }
    })(top);
  }
  for (const t of texts) {
    for (const line of t.split('\n').slice(0, 5)) {
      const m = STORY_RE.exec(line);
      if (m) return filePart(`${m[1]} ${m[2]}`);
    }
  }
  const title = filePart(charter?.title || hints[0] || '');
  return title && title !== sutName(charter) ? title : '';
}

// The run's name before the date: "<SUT> - <story ID> <story name>", or only the SUT when there is no story
// or the SUT line already names that story.
export function runLabel(charter, hints = []) {
  const sut = sutName(charter);
  const story = storyName(charter, hints);
  if (!story || sut === story || sut.includes(story.split(' ')[0])) return sut;
  return `${sut} - ${story}`;
}

// Where one run's files go: one folder per run, test-runs/<day>/<base>/ with <base>.html, <base>.json and the
// screenshots. The runner serves that folder at /report/<run_id>/.
export function runPaths(root, runId, sut) {
  const dayDir = path.join(root, 'test-runs', runDay(runId));
  const base = `${sut} - ${runDay(runId)} ${runTime(runId)}`;
  const runDir = path.join(dayDir, base);
  return { dayDir, base, runDir, assetsDir: runDir, html: `${base}.html`, json: `${base}.json` };
}

// The folder of an earlier run, from its run_id (null if there is none).
export function findRunDir(root, runId) {
  const day = path.join(root, 'test-runs', runDay(runId));
  const tail = ` - ${runDay(runId)} ${runTime(runId)}`;
  if (!fs.existsSync(day)) return null;
  const name = fs.readdirSync(day).find(f => f.endsWith(tail) && fs.statSync(path.join(day, f)).isDirectory());
  return name ? path.join(day, name) : null;
}

// "A b/c d.png" -> "A%20b/c%20d.png": a relative link that works from file:// and over http.
export const linkTo = p => String(p).split('/').map(encodeURIComponent).join('/');

// Charter name from the page -> a safe file name: only A-Z a-z 0-9 . _ -
export function safeName(name) {
  const s = String(name || '').replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^[.-]+/, '').slice(0, 80);
  return s || 'charter';
}

// Every charter test line (a node text starting with "A1 ", "W2 ", "I3 "...), in charter order.
export function charterIds(charter) {
  const ids = [];
  const seen = new Set();
  (function walk(node) {
    if (Array.isArray(node)) return node.forEach(walk);
    if (!node || typeof node !== 'object') return;
    if (typeof node.text === 'string') {
      const m = /^([AWI]\d+) /.exec(node.text.trim());
      if (m && !seen.has(m[1])) { seen.add(m[1]); ids.push(m[1]); }
    }
    for (const v of Object.values(node)) if (v && typeof v === 'object') walk(v);
  })(charter);
  return ids;
}

// "A12 · AC-5 · refuse the full name "A"" -> { ac: "AC-5", test: "refuse the full name "A"" }
export function splitTitle(title) {
  let rest = String(title || '').trim().replace(/^[AWI]\d+(?!\d)\s*(·|:|-)?\s*/, '');
  rest = rest.replace(/^[+−-]\s*·\s*/, '');                       // old style "+ ·" / "− ·"
  const m = /^(AC-\d+(?:\s*,\s*AC-\d+)*)\s*·\s*/.exec(rest);
  return m ? { ac: m[1].replace(/\s*,\s*/g, ', '), test: rest.slice(m[0].length) } : { ac: '', test: rest };
}

export function charterStory(charter) {
  if (!charter || typeof charter !== 'object') return '';
  return String(charter.root?.text || charter.title || '');
}

// ---------- Playwright JSON report -> result rows ----------
function firstLines(text, n = 8, max = 1500) {
  return stripAnsi(text).split('\n').slice(0, n).join('\n').trim().slice(0, max);
}

function inHook(result, spec) {
  const msg = stripAnsi((result.errors || []).map(e => e.message || '').join('\n') + (result.error?.message || ''));
  if (/"(beforeAll|beforeEach)" hook/.test(msg)) return true;
  // The browser itself would not start: an environment problem, not a test result.
  if (/browserType\.launch|Executable doesn't exist/.test(msg)) return true;
  const loc = result.errorLocation;
  // The error happened in the same file, above the test itself: a beforeAll / beforeEach hook.
  if (loc && spec.file && loc.file && loc.file.replace(/\\/g, '/').endsWith(spec.file.replace(/\\/g, '/'))
      && typeof spec.line === 'number' && loc.line < spec.line) return true;
  return false;
}

// One row per test in a Playwright JSON report.
//   passed  = passed on the first try
//   flaky   = failed, then passed on a retry
//   failed  = failed every try
//   not tested = test.fixme / test.skip (an ASK the charter hasn't answered yet)
//   blocked = interrupted, skipped for another reason, or failed in a beforeAll / beforeEach hook
export function rowsFromPlaywright(report, browser, runDir) {
  const rows = [];
  const walk = suite => {
    for (const spec of suite.specs || []) {
      for (const t of spec.tests || []) {
        const results = t.results || [];
        const last = results[results.length - 1] || {};
        let status;
        const asked = (t.annotations || spec.annotations || []).some(a => a.type === 'fixme' || a.type === 'skip');
        if (t.status === 'flaky') status = 'flaky';
        else if (t.status === 'skipped' && asked) status = 'not_tested';
        else if (t.status === 'skipped' || results.some(r => r.status === 'interrupted')) status = 'blocked';
        else if (t.status === 'expected') status = last.status === 'skipped' ? 'blocked' : 'passed';
        else status = results.length && inHook(last, spec) ? 'blocked' : 'failed';

        let error = null;
        let screenshot = null;
        if (status !== 'passed') {
          const bad = [...results].reverse().find(r => r.status !== 'passed' && r.status !== 'skipped') || last;
          const msg = (bad.errors || []).map(e => e.message || '').join('\n') || bad.error?.message || '';
          error = msg ? firstLines(msg) : (status === 'not_tested' ? 'Not written yet (test.fixme): answer its ASK'
            : status === 'blocked' ? 'Did not run (skipped or stopped)' : null);
          if (status === 'flaky' && error) error = `Passed on retry ${last.retry}. First failure:\n${error}`;
          const shot = (bad.attachments || []).find(a => a.name === 'screenshot' && a.path);
          if (shot && runDir) screenshot = path.relative(runDir, shot.path).split(path.sep).join('/');
        }
        rows.push({ id: idOf(spec.title), title: spec.title, browser, status, error, screenshot });
      }
    }
    for (const s of suite.suites || []) walk(s);
  };
  for (const s of report?.suites || []) walk(s);
  // A run that broke before any test (syntax error in a spec, bad config) has errors but no suites.
  if (!rows.length && report?.errors?.length) {
    rows.push({ id: '?', title: `${browser}: the run stopped before any test`, browser, status: 'blocked',
      error: firstLines(report.errors.map(e => e.message || '').join('\n')), screenshot: null });
  }
  return rows;
}

export function buildSummary({ runId, startedAt, finishedAt, baseUrl, browsers, charter, rows, only = null }) {
  const counts = { passed: 0, flaky: 0, failed: 0, blocked: 0, not_tested: 0 };
  for (const r of rows) counts[r.status] = (counts[r.status] || 0) + 1;
  const have = new Set(rows.map(r => r.id));
  const notTested = charterIds(charter).filter(id => !have.has(id) && (!only || only.includes(id)));
  counts.not_tested += notTested.length;
  return {
    run_id: runId,
    started_at: startedAt,
    finished_at: finishedAt,
    base_url: baseUrl,
    browsers,
    story: charterStory(charter),
    counts,
    results: rows,
    not_tested: notTested,
    report: 'index.html',      // set by runAll: "<SUT> - <story> - <day> <time>.html", relative to test-runs/<day>/
    messages: [],
    pushed: false,
    push_message: '',
  };
}

// ---------- our own report: index.html, nothing external ----------
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function reportHtml(summary) {
  const c = summary.counts;
  const label = { passed: 'Passed', flaky: 'Flaky', failed: 'Failed', blocked: 'Blocked', not_tested: 'Not tested' };
  const order = r => {
    const b = ['api', 'chrome', 'firefox'].indexOf(r.browser);
    const m = /^([AWI])(\d+)/.exec(r.id) || [];
    return [b < 0 ? 9 : b, m[1] ? 'AWI'.indexOf(m[1]) : 9, m[2] ? Number(m[2]) : 1e9];
  };
  const byOrder = (x, y) => { const a = order(x), b = order(y); return a[0] - b[0] || a[1] - b[1] || a[2] - b[2]; };
  const rows = [...[...summary.results].sort(byOrder), ...summary.not_tested.map(id => ({ id, title: `${id} · (no test ran for this charter line)`, browser: '-', status: 'not_tested' }))];
  const body = rows.map((r, i) => {
    const hasDetail = r.status !== 'passed' && (r.error || r.screenshot);
    const main = `<tr class="row ${r.status}${hasDetail ? ' click' : ''}" data-i="${i}"${hasDetail ? ' tabindex="0"' : ''}>
<td>${esc(r.id)}</td><td>${esc(splitTitle(r.title).ac)}</td><td>${esc(splitTitle(r.title).test)}</td><td>${esc(r.browser)}</td><td><span class="pill ${r.status}">${label[r.status] || esc(r.status)}</span></td></tr>`;
    if (!hasDetail) return main;
    return main + `<tr class="detail" id="d${i}"><td colspan="5">${r.error ? `<pre>${esc(r.error)}</pre>` : ''}${r.screenshot ? `<img src="${esc(linkTo(r.screenshot))}" alt="Screenshot of ${esc(r.id)} in ${esc(r.browser)}">` : ''}</td></tr>`;
  }).join('\n');
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Test run ${esc(summary.run_id)}</title>
<style>
:root{--ok:#15803d;--flaky:#b45309;--bad:#b91c1c;--blocked:#d97706;--grey:#6b7280;--line:#e5e7eb}
body{font:15px/1.45 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;margin:24px;color:#111827;background:#fff}
h1{font-size:22px;margin:0 0 4px} .meta{color:var(--grey);margin:0 0 16px}
.story{white-space:pre-wrap;background:#f9fafb;border:1px solid var(--line);border-radius:8px;padding:10px 12px;margin:0 0 16px}
.counts{display:flex;flex-wrap:wrap;gap:10px;margin:0 0 18px}
.count{border:1px solid var(--line);border-radius:8px;padding:8px 14px;min-width:90px}
.count b{display:block;font-size:24px}
table{border-collapse:collapse;width:100%} th,td{text-align:left;padding:7px 8px;border-bottom:1px solid var(--line);vertical-align:top}
th{background:#f3f4f6} tr.click{cursor:pointer} tr.click:hover{background:#f9fafb}
tr.detail{display:none} tr.detail.open{display:table-row} tr.detail td{background:#fafafa}
pre{white-space:pre-wrap;word-break:break-word;margin:0 0 8px;font-size:13px}
img{max-width:100%;border:1px solid var(--line)}
.pill{display:inline-block;padding:1px 8px;border-radius:99px;color:#fff;font-size:13px;white-space:nowrap}
.pill.passed{background:var(--ok)}.pill.flaky{background:var(--flaky)}.pill.failed{background:var(--bad)}
.pill.blocked{background:var(--blocked)}.pill.not_tested{background:var(--grey)}
.hint{color:var(--grey);font-size:13px}
.msg{background:#fef3c7;border:1px solid #f59e0b;border-radius:8px;padding:8px 12px;margin:0 0 12px}
.print{font:inherit;padding:6px 14px;border:1px solid #1d4ed8;background:#1d4ed8;color:#fff;border-radius:6px;cursor:pointer}
@media print{tr.detail{display:table-row} .noprint{display:none} body{margin:0} tr{break-inside:avoid} img{max-height:90vh}}
</style></head><body>
<h1>Test run ${esc(summary.run_id)}</h1>
<p class="meta">${esc(summary.base_url)} · browsers: ${esc((summary.browsers || []).join(', '))} · ${esc(summary.started_at)} to ${esc(summary.finished_at)}</p>
${summary.pages_url ? `<p class="meta">On GitHub Pages about a minute after the push: <a href="${esc(summary.pages_url)}">${esc(summary.pages_url)}</a></p>` : ''}
${summary.story ? `<div class="story">${esc(summary.story)}</div>` : ''}
<div class="counts">${Object.keys(label).map(k => `<div class="count"><b>${c[k] || 0}</b>${label[k]}</div>`).join('')}</div>
${(summary.messages || []).map(m => `<p class="msg">${esc(m)}</p>`).join('')}
<p class="noprint"><button class="print" type="button" onclick="window.print()">Download PDF</button> <span class="hint">Choose "Save as PDF" in the print window. Click a red or amber row to see why.</span></p>
<table><thead><tr><th>Id</th><th>AC</th><th>Test</th><th>Browser</th><th>Result</th></tr></thead><tbody>
${body}
</tbody></table>
<script>
document.querySelectorAll('tr.click').forEach(function (tr) {
  function toggle() { var d = document.getElementById('d' + tr.dataset.i); if (d) d.classList.toggle('open'); }
  tr.addEventListener('click', toggle);
  tr.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
});
</script>
</body></html>
`;
}

// ---------- processes ----------
const PW_CLI = path.join(ROOT, 'node_modules', '@playwright', 'test', 'cli.js');
// Browsers the runner may install by itself before a run (Chrome and Edge need an administrator: the message says how).
const PW_INSTALL = { firefox: 'firefox', webkit: 'webkit' };

// The Install button in Charter360: Playwright installs the browser (Chrome and Edge ask for an administrator
// on some computers; then the error says to use the normal installer).
const INSTALL_NAME = { chrome: 'chrome', firefox: 'firefox', edge: 'msedge', webkit: 'webkit' };
const INSTALL_HELP = { chrome: 'https://www.google.com/chrome', edge: 'https://www.microsoft.com/edge' };
export async function installBrowser(b) {
  const r = await runNode([PW_CLI, 'install', INSTALL_NAME[b]], { env: { ...process.env, FORCE_COLOR: '0' }, timeoutMs: 20 * 60 * 1000 });
  if (r.code === 0 && !(await browserMissing(b))) return { ok: true };
  return { ok: false, error: INSTALL_HELP[b]
    ? `it needs an administrator here. Install it from ${INSTALL_HELP[b]}, then check again.`
    : 'the download failed. Check your internet, then try again.' };
}

// Which browsers are on this computer, for Charter360's Environment settings.
export async function installedBrowsers() {
  const out = {};
  for (const b of ALL_BROWSERS) out[b] = !(await browserMissing(b));
  return out;
}

// Run node with fixed arguments. onLine gets each stdout line. Never uses a shell.
// Kill a process and everything it started (Playwright, its workers, their browsers).
function killTree(child) {
  if (!child || child.exitCode !== null || child.signalCode) return;
  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore', timeout: 15000 });
    return;
  }
  const kids = new Map();
  const out = spawnSync('ps', ['-A', '-o', 'pid=,ppid='], { encoding: 'utf8', timeout: 15000 }).stdout || '';
  for (const line of out.trim().split('\n')) {
    const [pid, ppid] = line.trim().split(/\s+/).map(Number);
    if (!kids.has(ppid)) kids.set(ppid, []);
    kids.get(ppid).push(pid);
  }
  const all = [];
  const walk = pid => { all.push(pid); for (const c of kids.get(pid) || []) walk(c); };
  walk(child.pid);
  for (const pid of all) { try { process.kill(pid, 'SIGKILL'); } catch { /* already gone */ } }
}

// A run's stop switch: stop() kills the step that is running; the run then ends as "stopped".
export function makeControl() {
  return { stopped: false, child: null, stop() { this.stopped = true; killTree(this.child); } };
}

function runNode(args, { env, cwd = ROOT, onLine, control, timeoutMs = 45 * 60 * 1000 } = {}) {
  return new Promise(resolve => {
    if (control?.stopped) return resolve({ code: -1, out: '' });
    const child = spawn(process.execPath, args, { cwd, env, stdio: ['ignore', 'pipe', 'pipe'] });
    if (control) control.child = child;
    let out = '';
    let buf = '';
    const timer = setTimeout(() => child.kill(), timeoutMs);
    child.stdout.on('data', d => {
      const s = d.toString();
      process.stdout.write(s);
      out += s;
      buf += s;
      const lines = buf.split('\n');
      buf = lines.pop();
      if (onLine) lines.forEach(onLine);
    });
    child.stderr.on('data', d => process.stderr.write(d));
    child.on('error', e => { clearTimeout(timer); resolve({ code: -1, out: out + String(e) }); });
    child.on('close', code => { clearTimeout(timer); if (control) control.child = null; resolve({ code, out }); });
  });
}

export function git(args, root = ROOT) {
  const r = spawnSync('git', args, { cwd: root, encoding: 'utf8', timeout: 120000 });
  return { ok: r.status === 0, out: `${r.stdout || ''}${r.stderr || ''}`.trim() };
}

export function stripCredentials(url) {
  return String(url || '').replace(/^(\w+:\/\/)[^@/]+@/, '$1');
}

export function repoInfo(root = ROOT) {
  return {
    repo: path.basename(root),
    remote: stripCredentials(git(['remote', 'get-url', 'origin'], root).out.split('\n')[0] || ''),
    branch: git(['rev-parse', '--abbrev-ref', 'HEAD'], root).out.split('\n')[0] || '',
  };
}

// Open a URL (or a file) in Google Chrome, else in the default browser.
export function openInChrome(url) {
  const tryRun = (cmd, args) => spawnSync(cmd, args, { stdio: 'ignore', timeout: 15000 }).status === 0;
  if (process.platform === 'darwin') return tryRun('open', ['-a', 'Google Chrome', url]) || tryRun('open', [url]);
  if (process.platform === 'win32') return tryRun('cmd', ['/c', 'start', 'chrome', url]) || tryRun('cmd', ['/c', 'start', '""', url]);
  return tryRun('xdg-open', [url]);
}

// The test titles a step will run (listing starts no browser). [] if unknown.
function listTests(args, env) {
  const r = spawnSync(process.execPath, [PW_CLI, 'test', ...args, '--list', '--reporter=json'],
    { cwd: ROOT, env, encoding: 'utf8', timeout: 120000, maxBuffer: 64 * 1024 * 1024 });
  try {
    const titles = [];
    const walk = s => { for (const sp of s.specs || []) for (const _ of sp.tests || []) titles.push(sp.title); (s.suites || []).forEach(walk); };
    (JSON.parse(r.stdout).suites || []).forEach(walk);
    return titles;
  } catch { return []; }
}

// ["A1","W3"] -> a --grep that matches titles starting with those ids (after the describe titles).
export const onlyGrep = ids => `(?:^|\\s)(${ids.join('|')}) ·`;   // names are "<id> · <AC> · …"

// Is this browser installed? Checks the file only: never starts the browser.
export async function browserMissing(b, { exists = fs.existsSync, platform = process.platform, env = process.env } = {}) {
  const { chromium, firefox, webkit } = await import('@playwright/test');
  if (b === 'firefox') {
    return exists(firefox.executablePath()) ? null : "Firefox isn't installed: run npx playwright install firefox";
  }
  if (b === 'webkit') {
    return exists(webkit.executablePath()) ? null : "Safari's engine (WebKit) isn't installed: run npx playwright install webkit";
  }
  const home0 = env.HOME || env.USERPROFILE || '';
  if (b === 'edge') {
    const edge = platform === 'darwin'
      ? ['/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge', path.join(home0, 'Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge')]
      : platform === 'win32'
        ? [env.PROGRAMFILES, env['PROGRAMFILES(X86)']].filter(Boolean).map(d => path.join(d, 'Microsoft', 'Edge', 'Application', 'msedge.exe'))
        : ['/opt/microsoft/msedge/msedge', '/usr/bin/microsoft-edge'];
    return edge.some(p => exists(p)) ? null : "Microsoft Edge isn't installed: install it from https://www.microsoft.com/edge (or run npx playwright install msedge)";
  }
  if (env.CI) return exists(chromium.executablePath()) ? null : "Chromium isn't installed: run npx playwright install chromium";
  const home = env.HOME || env.USERPROFILE || '';
  const paths = platform === 'darwin'
    ? ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', path.join(home, 'Applications/Google Chrome.app/Contents/MacOS/Google Chrome')]
    : platform === 'win32'
      ? [env.PROGRAMFILES, env['PROGRAMFILES(X86)'], env.LOCALAPPDATA].filter(Boolean).map(d => path.join(d, 'Google', 'Chrome', 'Application', 'chrome.exe'))
      : ['/opt/google/chrome/chrome', '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable'];
  return paths.some(p => exists(p)) ? null : "Google Chrome isn't installed: run npx playwright install chrome";
}

// test-runs/index.html: every run, newest first, each linking its report. GitHub Pages shows this page.
export function writeRunsIndex(root = ROOT) {
  const top = path.join(root, 'test-runs');
  const runs = [];
  for (const day of fs.existsSync(top) ? fs.readdirSync(top).filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d)) : []) {
    const dayDir = path.join(top, day);
    const files = [];   // [folder relative to the day ('' = old layout), json file]
    for (const f of fs.readdirSync(dayDir)) {
      const full = path.join(dayDir, f);
      if (f.endsWith('.json')) files.push(['', f]);
      else if (fs.statSync(full).isDirectory()) for (const g of fs.readdirSync(full).filter(g => g.endsWith('.json'))) files.push([f, g]);
    }
    for (const [dir, f] of files) {
      try {
        const s = JSON.parse(fs.readFileSync(path.join(dayDir, dir, f), 'utf8'));
        if (s.run_id && s.counts) runs.push({ day, dir, s });
      } catch { /* not a summary */ }
    }
  }
  runs.sort((a, b) => b.s.run_id.localeCompare(a.s.run_id));
  const c = s => `${s.counts.passed} passed, ${s.counts.flaky} flaky, ${s.counts.failed} failed, ${s.counts.blocked} blocked, ${s.counts.not_tested} not tested`;
  let lastDay = '';
  const items = runs.map(({ day, dir, s }) => {
    const head = day !== lastDay ? `${lastDay ? '</ul>' : ''}<h2>${esc(day)}</h2><ul>` : '';
    lastDay = day;
    return `${head}<li><a href="${esc(linkTo([day, dir, s.report].filter(Boolean).join('/')))}">${esc(s.report.replace(/\.html$/, ''))}</a> <span>${esc(c(s))}</span></li>`;
  }).join('\n');
  fs.mkdirSync(top, { recursive: true });
  fs.writeFileSync(path.join(top, 'index.html'), `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Test runs</title>
<style>body{font:15px/1.5 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;margin:24px;color:#111827}
h1{font-size:22px} h2{font-size:16px;margin:18px 0 6px} li{margin:4px 0} span{color:#6b7280;font-size:13px}</style>
</head><body><h1>Test runs</h1>
${items ? items + '</ul>' : '<p>No runs yet.</p>'}
</body></html>
`);
}

// ---------- headed runs: one Chrome window that stays open, every test a new tab ----------
// The window belongs to this process (the runner or test:watch). Tests reach it through Chrome's
// DevTools port (PW_CDP_CHROME), open their own tab, and leave it open. The next run closes it.
const held = [];
export async function closeHeldBrowsers() {
  for (const h of held.splice(0)) await h.close().catch(() => {});
}
export const heldBrowserCount = () => held.length;

function freePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.once('error', reject);
    srv.listen(0, '127.0.0.1', () => { const { port } = srv.address(); srv.close(() => resolve(port)); });
  });
}

async function openChromeWindow() {
  const { chromium } = await import('@playwright/test');
  const port = await freePort();
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'uctp-chrome-'));
  const context = await chromium.launchPersistentContext(dir, {
    channel: 'chrome', headless: false, viewport: null, args: [`--remote-debugging-port=${port}`],
  });
  held.push({ context, close: async () => { await context.close(); fs.rmSync(dir, { recursive: true, force: true }); } });
  return `http://127.0.0.1:${port}`;
}

// Open a page as a new tab in the runner's own Chrome window (the one with the test tabs).
// false if there is no such window (headless, or Chrome wasn't in the run).
async function openInRunWindow(url) {
  const h = held.find(x => x.context);
  if (!h) return false;
  try {
    const page = await h.context.newPage();
    await page.goto(url);
    await page.bringToFront();
    return true;
  } catch { return false; }
}

// This run's report on GitHub Pages, from the git remote: https://<owner>.github.io/<repo>/<day>/<file>
export function pagesUrl(remote, day, file) {
  const m = /github\.com[:/]([^/]+)\/([^/]+?)(?:\.git)?\/?$/.exec(String(remote || '').trim());
  if (!m) return null;
  const [, owner, repo] = m;
  const site = repo.toLowerCase() === `${owner.toLowerCase()}.github.io` ? `https://${repo.toLowerCase()}/` : `https://${owner.toLowerCase()}.github.io/${repo}/`;
  return `${site}${linkTo(`${day}/${file}`)}`;
}

// ---------- the whole run ----------
// opts: { charter, name, story (lines from Charter360: map title, story box), baseUrl, browsers, headed, push, open, reportUrl(runId, reportFile), onProgress(p) }
export async function runAll(opts) {
  const root = ROOT;
  const runId = opts.runId || newRunId();
  const startedAt = new Date().toISOString();
  const P = runPaths(root, runId, runLabel(opts.charter, opts.story || []));
  const rawDir = path.join(P.assetsDir, 'raw');
  fs.mkdirSync(rawDir, { recursive: true });

  const browsers = opts.browsers;
  const progress = { state: 'running', step: 'saving', done: 0, total: 0, message: 'Saving the charter' };
  const tell = patch => { Object.assign(progress, patch); opts.onProgress?.({ ...progress }); };
  tell({});

  const baseEnv = { ...process.env, BASE_URL: opts.baseUrl, FORCE_COLOR: '0' };
  if (opts.nameTag) baseEnv.UCTP_NAME_TAG = opts.nameTag;   // config/environment.js reads it before its own ME
  for (const k of ['PW_JSON_FILE', 'PW_OUTPUT_DIR', 'PW_TABS', 'PW_CDP_CHROME']) delete baseEnv[k];
  // only: run just these ids (["A1","W3"]); a step with none of them is skipped (no browser opens).
  const only = Array.isArray(opts.only) && opts.only.length ? opts.only : null;
  const grep = only ? onlyGrep(only) : opts.grep;
  // files: only this charter's test files (saved with it from Charter360); none given = every file.
  const files = Array.isArray(opts.files) ? opts.files : null;
  const apiFiles = files ? files.filter(f => f.startsWith('tests/api/')) : ['tests/api'];
  const webFiles = files ? files.filter(f => /^tests\/(web|integration)\//.test(f)) : ['tests/web', 'tests/integration'];
  const wantApi = apiFiles.length > 0 && (!only || only.some(id => id[0] === 'A'));
  const wantBrowsers = webFiles.length > 0 && (!only || only.some(id => id[0] === 'W' || id[0] === 'I'));
  const control = opts.control || makeControl();
  const common = ['--workers=1', '--retries=3', '--pass-with-no-tests', ...(grep ? ['--grep', String(grep)] : [])];
  const finished = new Set();   // steps that ran to the end
  const rows = [];
  const messages = [];

  // 1. Save the charter.
  if (opts.saveCharter !== false && opts.charter && typeof opts.charter === 'object') {
    fs.mkdirSync(path.join(root, 'charters'), { recursive: true });
    fs.writeFileSync(path.join(root, 'charters', `${safeName(opts.name)}.json`), JSON.stringify(opts.charter, null, 1));
  }

  // Progress total (listing starts no browser).
  const browserArgs = b => [...webFiles, `--project=${b}`, ...common];
  const apiArgs = [...apiFiles, '--project=api', ...common];
  let total = wantApi ? listTests(apiArgs, baseEnv).length : 0;
  if (wantBrowsers) for (const b of browsers) total += listTests(browserArgs(b), baseEnv).length;
  tell({ total });

  const countLine = line => {
    if (/^\s*(✓|✘|ok|x|-)\s+\d+\s+(\[|›)/.test(line) && !/retry #/.test(line)) {
      tell({ done: Math.min(progress.done + 1, progress.total || Infinity) });
    }
  };

  // 2. API tests, once.
  //    The api project has no browser: a test there that asks for one fails (playwright.config.ts).
  if (wantApi && !control.stopped) {
    tell({ step: 'api', message: 'API tests' });
    const jsonFile = path.join(rawDir, 'api.json');
    const env = { ...baseEnv, PW_JSON_FILE: jsonFile, PW_OUTPUT_DIR: path.join(P.assetsDir, 'artifacts', 'api') };
    await runNode([PW_CLI, 'test', ...apiArgs], { env, onLine: countLine, control });
    if (!control.stopped) { rows.push(...readPwRows(jsonFile, 'api', P.runDir)); finished.add('api'); }
  }

  // 3. Web + integration tests in each browser, one browser at a time.
  //    Headed: one window per browser, every test a new tab (helpers/web.ts, PW_TABS=1).
  if (opts.headed) await closeHeldBrowsers();      // last run's windows
  for (const b of wantBrowsers ? browsers : []) {
    if (control.stopped) break;
    const name = BROWSER_LABEL[b] || b;
    tell({ step: b, message: `Web and integration tests in ${name} (browser ${browsers.indexOf(b) + 1} of ${browsers.length})` });
    let missing = await browserMissing(b);
    if (missing && PW_INSTALL[b] && opts.install !== false) {   // Playwright's own browsers install without an admin
      tell({ message: `Installing ${name} (one time, a few minutes)…` });
      await runNode([PW_CLI, 'install', PW_INSTALL[b]], { env: baseEnv, control });
      missing = await browserMissing(b);
    }
    if (missing) {                                  // never start a browser that isn't there
      messages.push(missing);
      const titles = listTests(browserArgs(b), baseEnv);
      rows.push(...titles.map(title => ({ id: idOf(title), title, browser: b, status: 'not_tested', error: missing, screenshot: null })));
      tell({ done: Math.min(progress.done + titles.length, progress.total || Infinity), message: missing });
      finished.add(b);
      continue;
    }
    const jsonFile = path.join(rawDir, `${b}.json`);
    const env = { ...baseEnv, PW_JSON_FILE: jsonFile, PW_OUTPUT_DIR: path.join(P.assetsDir, 'artifacts', b) };
    if (opts.headed) {
      env.PW_TABS = '1';
      if (b === 'chrome') {
        try { env.PW_CDP_CHROME = await openChromeWindow(); }
        catch (e) { console.log(`(Chrome window for tabs not opened: ${stripAnsi(e.message).split('\n')[0]}. Tests still run.)`); }
      }
    }
    const args = [PW_CLI, 'test', ...browserArgs(b)];
    if (opts.headed) args.push('--headed');
    await runNode(args, { env, onLine: countLine, control });
    if (!control.stopped) { rows.push(...readPwRows(jsonFile, b, P.runDir)); finished.add(b); }
  }

  // 4. The report: <SUT> - <story> - <day> <time>.html and .json in the run's folder, and the runs list.
  // Stopped: the steps that didn't finish count as Not tested.
  if (control.stopped) {
    const steps = [...(wantApi ? [['api', apiArgs]] : []), ...(wantBrowsers ? browsers.map(b => [b, browserArgs(b)]) : [])];
    for (const [step, args] of steps.filter(([step]) => !finished.has(step))) {
      rows.push(...listTests(args, baseEnv).map(title => ({ id: idOf(title), title, browser: step, status: 'not_tested', error: 'Stopped by you', screenshot: null })));
    }
    messages.push('Stopped by you');
  }
  tell({ step: 'report', message: 'Writing the report' });
  const summary = buildSummary({ runId, startedAt, finishedAt: new Date().toISOString(), baseUrl: opts.baseUrl,
    browsers, charter: opts.charter, rows, only });
  Object.assign(summary, { report: P.html, folder: `test-runs/${runDay(runId)}/${P.base}`, messages });
  // Where this report will be on GitHub Pages (only when the run is pushed).
  summary.pages_url = (opts.push !== false && !control.stopped)
    ? pagesUrl(repoInfo(root).remote, runDay(runId), `${P.base}/${P.html}`) : null;
  if (only) summary.only = only;
  if (control.stopped) summary.stopped = true;
  const htmlFile = path.join(P.runDir, P.html);
  const writeOut = () => fs.writeFileSync(path.join(P.runDir, P.json), JSON.stringify(summary, null, 2));
  writeOut();
  fs.writeFileSync(htmlFile, reportHtml(summary));
  writeRunsIndex(root);

  // 5. Open the report in Chrome.
  if (opts.open !== false && !control.stopped) {
    const url = opts.reportUrl ? opts.reportUrl(runId, P.html) : pathToFileURL(htmlFile).href;
    if (!(opts.headed && await openInRunWindow(url))) openInChrome(url);   // headed: a new tab next to the test tabs
  }

  // 6. Commit and push, so CI (and GitHub Pages) run too. A failed push doesn't fail the run.
  tell({ step: 'push', message: 'Saving to GitHub' });
  if (control.stopped) {
    summary.push_message = 'Not pushed: stopped by you.';
  } else if (opts.push === false) {
    summary.push_message = 'Not pushed: NO_PUSH=1 is set.';
  } else {
    git(['add', 'charters', 'tests', 'test-runs'], root);
    const commit = git(['commit', '-m', `Test run ${runId}`], root);
    if (!commit.ok && !/nothing to commit|no changes added/.test(commit.out)) {
      summary.push_message = `Commit failed: ${commit.out.split('\n').slice(-2).join(' ')}`;
    } else {
      const push = git(['push'], root);
      summary.pushed = push.ok;
      summary.push_message = push.ok ? 'Pushed. CI runs on GitHub too.'
        : `Push failed: ${push.out.split('\n').slice(-3).join(' ')}. Fix: run "git push" in this folder and sign in to GitHub, then RUN again.`;
    }
  }
  writeOut();   // keeps the push result locally (it goes up with the next run)

  if (control.stopped) tell({ state: 'stopped', message: 'Stopped by you', summary });
  else tell({ state: 'done', step: 'push', done: progress.total || rows.length, message: summary.push_message, summary });
  return summary;
}

function readPwRows(jsonFile, browser, runDir) {
  if (!fs.existsSync(jsonFile)) return [];
  try {
    return rowsFromPlaywright(JSON.parse(fs.readFileSync(jsonFile, 'utf8')), browser, runDir);
  } catch {
    return [{ id: '?', title: `${browser}: the results file could not be read`, browser, status: 'blocked', error: jsonFile, screenshot: null }];
  }
}


// The tests in the repo's test files, for Charter360's count check before RUN: each file's test ids (A1, W3 …)
// and whether a bare test.fixme('…') / test.skip('…') (no body) would skip the whole file.
const TEST_ID_RE = /\btest(?:\.(?:fixme|skip|only|fail))?\(\s*(['"`])([AWI]\d{1,3})\s*·/g;
const BARE_SKIP_RE = /\btest\.(?:fixme|skip)\(\s*(['"`])(?:\\.|(?!\1)[^\n])*\1\s*\)/;
export function scanTests(root = ROOT, only = null) {
  const out = [];
  for (const kind of ['api', 'web', 'integration']) {
    const dir = path.join(root, 'tests', kind);
    let names = [];
    try { names = fs.readdirSync(dir).filter(n => /\.spec\.(ts|js|mjs)$/.test(n)).sort(); } catch { /* no folder */ }
    for (const n of names) {
      const rel = `tests/${kind}/${n}`;
      if (only && !only.includes(rel)) continue;
      const text = fs.readFileSync(path.join(dir, n), 'utf8');
      const ids = [...text.matchAll(TEST_ID_RE)].map(m => m[2]);
      out.push({ path: rel, ids, bare_skip: BARE_SKIP_RE.test(text) });
    }
  }
  return out;
}

// The test files saved with a charter (charters/<name>.files.json), or null for a charter saved before this list.
export function charterFiles(root, name) {
  try {
    const list = JSON.parse(fs.readFileSync(path.join(root, 'charters', `${safeName(name)}.files.json`), 'utf8'));
    return Array.isArray(list) ? list.filter(f => typeof f === 'string' && fs.existsSync(path.join(root, ...f.split('/')))) : null;
  } catch { return null; }
}
export function saveCharterFiles(root, name, paths, replace) {
  const old = replace ? [] : (charterFiles(root, name) || []);
  const list = [...new Set([...old, ...paths.filter(p => p.startsWith('tests/'))])].sort();
  fs.mkdirSync(path.join(root, 'charters'), { recursive: true });
  fs.writeFileSync(path.join(root, 'charters', `${safeName(name)}.files.json`), JSON.stringify(list, null, 1) + '\n');
  return list;
}
