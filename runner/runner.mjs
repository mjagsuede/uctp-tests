// The local runner: Charter360's RUN button talks to this (npm run runner).
//
// Safety:
//   - listens on 127.0.0.1 only (never the network), port 7357
//   - answers only pages from the Charter360 sites (Origin check) that send the pairing code
//   - writes files only under tests/ and charters/, with strict names
//   - runs only fixed Playwright and git commands, never a command sent by the page
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { askAi, AI_PROVIDERS } from './ai.mjs';
import { ROOT, ALL_BROWSERS, STAGING_HOST, loadEnvironment, newRunId, safeName, repoInfo, runAll, closeHeldBrowsers, runDay, findRunDir, linkTo, makeControl, scanTests, charterFiles, saveCharterFiles, installedBrowsers, installBrowser } from './lib.mjs';

export const PORT = 7357;
export const DEFAULT_ORIGINS = [
  'https://qe-360-academy.aiqe.pro',
  'https://qe-360-academy-staging.aiqe.pro',
  'http://127.0.0.1:8106',
  'http://localhost:8106',
];
export const FILE_PATH_RE = /^(tests\/(api|web|integration)\/[A-Za-z0-9._-]+\.spec\.(ts|js|mjs)|charters\/[A-Za-z0-9._-]+\.json)$/;
const MAX_FILES = 30;
const MAX_FILE_BYTES = 200 * 1024;
const MAX_BODY_BYTES = 8 * 1024 * 1024;
const RUN_ID_RE = /^\d{8}-\d{6}(-\d+)?$/;

const list = v => String(v || '').split(',').map(s => s.trim()).filter(Boolean);

// The 6-digit pairing code: made on the first start, kept in .runner-code (git-ignored).
// A finished run's summary on disk: the .json in that run's folder.
function findSummary(root, id) {
  const dir = findRunDir(root, id);
  if (!dir) return null;
  for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.json'))) {
    try { const s = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); if (s.run_id === id) return s; } catch { /* skip */ }
  }
  return null;
}

export function pairingCode(root = ROOT) {
  const file = path.join(root, '.runner-code');
  try {
    const code = fs.readFileSync(file, 'utf8').trim();
    if (/^\d{6}$/.test(code)) return code;
  } catch { /* first start */ }
  const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
  fs.writeFileSync(file, code + '\n', { mode: 0o600 });
  return code;
}

function sameCode(given, code) {
  const a = Buffer.from(String(given || ''));
  const b = Buffer.from(code);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

const TYPES = { '.html': 'text/html; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.pdf': 'application/pdf', '.txt': 'text/plain; charset=utf-8',
  '.webm': 'video/webm', '.zip': 'application/zip', '.css': 'text/css; charset=utf-8' };

// opts: { root, code, port, origins, hosts, start(job) } -- start is replaceable in tests.
export function createRunner(opts = {}) {
  const root = opts.root || ROOT;
  const code = opts.code || pairingCode(root);
  const port = opts.port ?? PORT;
  const origins = new Set([...DEFAULT_ORIGINS, ...list(process.env.RUNNER_ORIGINS), ...(opts.origins || [])]);
  const hosts = new Set([STAGING_HOST, ...list(process.env.RUNNER_HOSTS), ...(opts.hosts || [])]);
  const env = loadEnvironment(root);
  const runs = new Map();
  let busy = false;
  let current = null;   // the job that is running
  const installs = {};  // browser -> 'installing' | 'done' | 'failed: …' (Install buttons in Charter360)

  const start = opts.start || (job => runAll({
    ...job, headed: job.headed !== false && process.env.HEADED !== '0', push: process.env.NO_PUSH !== '1',
    reportUrl: (id, file) => `http://127.0.0.1:${server.address().port}/report/${id}/${linkTo(file)}`,
    onProgress: p => runs.set(job.runId, { ...p }),
  }));

  function send(res, status, body, origin) {
    const headers = { 'Content-Type': 'application/json; charset=utf-8', Vary: 'Origin', 'Cache-Control': 'no-store' };
    if (origin) headers['Access-Control-Allow-Origin'] = origin;
    res.writeHead(status, headers);
    res.end(JSON.stringify(body));
  }

  function readJson(req) {
    return new Promise((resolve, reject) => {
      let size = 0;
      const chunks = [];
      req.on('data', c => {
        size += c.length;
        if (size > MAX_BODY_BYTES) { reject(Object.assign(new Error('Request is too big (8 MB at most).'), { status: 413 })); req.destroy(); return; }
        chunks.push(c);
      });
      req.on('end', () => {
        try { resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {}); }
        catch { reject(Object.assign(new Error('The body is not JSON.'), { status: 400 })); }
      });
      req.on('error', reject);
    });
  }

  function serveReport(res, urlPath, origin) {
    const parts = urlPath.split('/').slice(2).map(p => { try { return decodeURIComponent(p); } catch { return '..'; } });
    const [id, ...rest] = parts;
    if (!RUN_ID_RE.test(id || '') || !rest.length || rest.some(p => !p || p === '.' || p === '..' || /[\\/\0]/.test(p))) {
      return send(res, 400, { error: 'Bad report path.' }, origin);
    }
    const runDir = findRunDir(root, id);                         // the run's own folder
    const file = runDir ? path.join(runDir, ...rest) : '';
    if (!runDir || !file.startsWith(runDir + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
      return send(res, 404, { error: 'Not found.' }, origin);
    }
    const headers = { 'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store', Vary: 'Origin' };
    if (origin) headers['Access-Control-Allow-Origin'] = origin;
    res.writeHead(200, headers);
    fs.createReadStream(file).pipe(res);
  }

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://127.0.0.1');
    const p = url.pathname.replace(/\/+$/, '') || '/';
    const origin = req.headers.origin;
    const allowed = origin && origins.has(origin) ? origin : null;

    // Only answer requests addressed to this computer (stops DNS-rebinding tricks).
    const host = String(req.headers.host || '').toLowerCase();
    if (!/^(127\.0\.0\.1|localhost|\[::1\])(:\d+)?$/.test(host)) return send(res, 403, { error: 'Wrong host.' });

    if (origin && !allowed) return send(res, 403, { error: `Origin ${origin} is not allowed. Add it with RUNNER_ORIGINS=<origin> npm run runner.` });

    if (req.method === 'OPTIONS') {
      if (!allowed) return send(res, 403, { error: 'Origin missing.' });
      res.writeHead(204, {
        'Access-Control-Allow-Origin': allowed,
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Runner-Code',
        'Access-Control-Allow-Private-Network': 'true',
        'Access-Control-Max-Age': '600',
        Vary: 'Origin',
      });
      return res.end();
    }

    const paired = sameCode(req.headers['x-runner-code'], code);

    try {
      if (req.method === 'GET' && p === '/status') {
        return send(res, 200, { ok: true, version: '1', paired, ...repoInfo(root), browsers: ALL_BROWSERS, busy,
          installed: paired ? await installedBrowsers() : undefined, installs: paired ? installs : undefined,
          ai_providers: Object.keys(AI_PROVIDERS).filter(k => k !== 'claude-code' || process.env.CHARTER360_CLAUDE_CODE === '1') }, allowed);
      }
      if (req.method === 'GET' && p.startsWith('/report/')) return serveReport(res, p, allowed);

      // Everything else: from a Charter360 page, with the pairing code.
      if (!allowed) return send(res, 403, { error: 'Requests must come from Charter360.' });
      if (!paired) return send(res, 401, { error: 'Wrong or missing pairing code. Type the code the runner printed into Charter360 › Environment settings.' }, allowed);

      if (req.method === 'POST' && p === '/files') {
        const body = await readJson(req);
        const files = body.files;
        if (!Array.isArray(files) || !files.length) return send(res, 400, { error: 'Send {"files":[{"path":"…","content":"…"}]}.' }, allowed);
        if (files.length > MAX_FILES) return send(res, 400, { error: `At most ${MAX_FILES} files.` }, allowed);
        for (const f of files) {
          if (!f || typeof f.path !== 'string' || !FILE_PATH_RE.test(f.path)) {
            return send(res, 400, { error: `Not allowed: ${String(f?.path).slice(0, 200)}. Files go only in tests/api, tests/web, tests/integration (*.spec.ts) or charters (*.json).` }, allowed);
          }
          if (typeof f.content !== 'string' || Buffer.byteLength(f.content) > MAX_FILE_BYTES) {
            return send(res, 400, { error: `${f.path}: content must be text, 200 KB at most.` }, allowed);
          }
        }
        for (const f of files) {
          const dest = path.join(root, ...f.path.split('/'));
          fs.mkdirSync(path.dirname(dest), { recursive: true });
          fs.writeFileSync(dest, f.content);
        }
        const written = files.map(f => f.path);
        // Saved with a charter: remember its files, so its RUN runs only those.
        const saved = typeof body.charter === 'string' && body.charter.trim()
          ? saveCharterFiles(root, body.charter, written, body.replace === true) : null;
        return send(res, 200, { written, charter_files: saved }, allowed);
      }

      if (req.method === 'GET' && p === '/tests') {
        const name = url.searchParams.get('charter');
        const own = name ? charterFiles(root, name) : null;
        return send(res, 200, { files: scanTests(root, own), charter_files: own }, allowed);
      }

      if (req.method === 'POST' && p === '/run') {
        if (busy) return send(res, 409, { error: 'A run is already going. Wait for it to finish.' }, allowed);
        const body = await readJson(req);
        let base;
        try { base = new URL(String(body.base_url || env.BASE_URL)); } catch { return send(res, 400, { error: 'base_url is not a URL.' }, allowed); }
        if (base.protocol !== 'https:') return send(res, 400, { error: 'base_url must start with https://' }, allowed);
        if (!hosts.has(base.hostname)) {
          return send(res, 400, { error: `${base.hostname} is not a test site this runner knows. Only test staging sites. To add it, stop the runner and start it with: RUNNER_HOSTS=${base.hostname} npm run runner` }, allowed);
        }
        const browsers = body.browsers === undefined ? env.browsers : body.browsers;
        if (!Array.isArray(browsers) || !browsers.length || browsers.some(b => !ALL_BROWSERS.includes(b)) || new Set(browsers).size !== browsers.length) {
          return send(res, 400, { error: `browsers must be a list of ${ALL_BROWSERS.join(', ')} (each once).` }, allowed);
        }
        const runId = newRunId(new Date(), root);
        let only = null;
        if (body.only !== undefined) {
          const ids = Array.isArray(body.only) ? [...new Set(body.only)] : null;
          if (!ids || !ids.length || ids.length > 50 || ids.some(id => typeof id !== 'string' || !/^[AWI]\d{1,3}$/.test(id))) {
            return send(res, 400, { error: 'only must be a list of 1 to 50 test ids like "A1", "W3", "I1".' }, allowed);
          }
          only = ids;
        }
        if (body.headed !== undefined && typeof body.headed !== 'boolean') return send(res, 400, { error: 'headed must be true or false.' }, allowed);
        if (body.name_tag !== undefined && (typeof body.name_tag !== 'string' || !/^[A-Za-z0-9._-]{2,40}$/.test(body.name_tag) || /^Ana-4821$/.test(body.name_tag))) {
          return send(res, 400, { error: 'name_tag must be your own name-tag from the UCTP top bar, like "Mitch-6973".' }, allowed);
        }
        if (body.story !== undefined && (typeof body.story !== 'string' || body.story.length > 2000)) {
          return send(res, 400, { error: 'story must be text, 2000 characters at most.' }, allowed);
        }
        const story = typeof body.story === 'string' ? body.story.split('\n').map(s => s.trim()).filter(Boolean).slice(0, 5) : [];
        const job = { runId, charter: body.charter && typeof body.charter === 'object' ? body.charter : null,
          name: safeName(body.name), baseUrl: base.origin, browsers, only, headed: body.headed !== false, control: makeControl(),
          nameTag: body.name_tag || null, files: charterFiles(root, body.name), story };
        busy = true;
        current = job;
        runs.set(runId, { state: 'running', step: 'saving', done: 0, total: 0, message: 'Starting' });
        Promise.resolve()
          .then(() => start(job))
          .then(summary => runs.set(runId, { ...(runs.get(runId) || {}), state: summary?.stopped ? 'stopped' : 'done', ...(summary?.stopped ? { message: 'Stopped by you' } : {}), summary }))
          .catch(e => runs.set(runId, { ...(runs.get(runId) || {}), state: 'error', message: String(e?.message || e) }))
          .finally(() => { busy = false; current = null; });
        return send(res, 200, { run_id: runId }, allowed);
      }

      if (req.method === 'POST' && p === '/install') {
        const body = await readJson(req);
        const b = body.browser;
        if (!ALL_BROWSERS.includes(b)) return send(res, 400, { error: `browser must be one of ${ALL_BROWSERS.join(', ')}.` }, allowed);
        if (busy) return send(res, 409, { error: 'A run is going. Install after it finishes.' }, allowed);
        if (installs[b] === 'installing') return send(res, 200, { installing: b }, allowed);
        installs[b] = 'installing';
        (opts.install || installBrowser)(b).then(r => { installs[b] = r.ok ? 'done' : `failed: ${r.error}`; },
          e => { installs[b] = `failed: ${String(e?.message || e)}`; });
        return send(res, 200, { installing: b }, allowed);
      }

      if (req.method === 'POST' && p === '/ai') {
        const body = await readJson(req);
        const r = await (opts.askAi || askAi)(body);
        // A provider's own error comes back as 502 with its status, so a 401 from the provider isn't read as a wrong pairing code.
        return send(res, r.ok ? 200 : 502, r.ok ? { text: r.text } : { error: r.error, provider_status: r.status }, allowed);
      }

      if (req.method === 'POST' && p === '/stop') {
        if (!busy || !current) return send(res, 409, { error: 'Nothing is running.' }, allowed);
        current.control.stop();
        return send(res, 200, { stopping: true, run_id: current.runId }, allowed);
      }

      const m = /^\/run\/([^/]+)$/.exec(p);
      if (req.method === 'GET' && m) {
        const id = m[1];
        if (runs.has(id)) return send(res, 200, runs.get(id), allowed);
        const summary = RUN_ID_RE.test(id) && findSummary(root, id);
        if (summary) {
          return send(res, 200, { state: 'done', step: 'push', done: summary.results.length, total: summary.results.length, message: summary.push_message || '', summary }, allowed);
        }
        return send(res, 404, { error: 'No run with that id.' }, allowed);
      }

      return send(res, 404, { error: 'Not found.' }, allowed);
    } catch (e) {
      return send(res, e.status || 500, { error: String(e.message || e) }, allowed);
    }
  });

  return {
    server,
    code,
    listen: () => new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(port, '127.0.0.1', () => resolve(server.address().port));
    }),
    close: () => new Promise(resolve => server.close(() => resolve())),
  };
}

// Port 7357 is busy: is it our runner (maybe left running after its terminal tab closed)?
// status = the /status answer (null if not our runner), paired = it accepted this folder's code.
export function busyPortMessage({ status, paired, code, pid, port = PORT }) {
  const stop = pid
    ? `kill ${pid}${process.platform === 'win32' ? ` (Windows: taskkill /PID ${pid} /F)` : ''}`
    : (process.platform === 'win32'
      ? `find its PID with: netstat -ano | findstr :${port}, then: taskkill /PID <pid> /F`
      : `find its PID with: lsof -nP -iTCP:${port} -sTCP:LISTEN, then: kill <pid>`);
  if (!status) return `Another program uses port ${port}, so the runner can't start. Close that program, or stop it with: ${stop}`;
  const folder = status.repo || '?';
  const use = paired ? `Use it: pairing code ${code}.` : `It runs from another folder (${folder}): use the code in that folder's .runner-code file.`;
  return `Your runner is already running (folder: ${folder}, started earlier). ${use}\nTo restart it, stop it with: ${stop}`;
}

async function explainBusyPort() {
  let status = null;
  let paired = false;
  const code = (() => { try { return fs.readFileSync(path.join(ROOT, '.runner-code'), 'utf8').trim(); } catch { return ''; } })();
  try {
    const res = await fetch(`http://127.0.0.1:${PORT}/status`, { headers: code ? { 'X-Runner-Code': code } : {}, signal: AbortSignal.timeout(3000) });
    const body = await res.json();
    if (body && body.ok === true && body.version === '1' && 'paired' in body) { status = body; paired = body.paired === true; }
  } catch { /* not our runner */ }
  let pid = '';
  try {
    if (process.platform === 'win32') {
      const out = spawnSync('netstat', ['-ano'], { encoding: 'utf8', timeout: 5000 }).stdout || '';
      const line = out.split('\n').find(l => l.includes(`:${PORT} `) && /LISTENING/.test(l));
      pid = line ? line.trim().split(/\s+/).pop() : '';
    } else {
      pid = (spawnSync('lsof', ['-nP', `-iTCP:${PORT}`, '-sTCP:LISTEN', '-t'], { encoding: 'utf8', timeout: 5000 }).stdout || '').trim().split('\n')[0];
    }
  } catch { /* no pid: the message says how to find it */ }
  return busyPortMessage({ status, paired, code, pid: /^\d+$/.test(pid) ? pid : '' });
}

// npm run runner
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const runner = createRunner();
  const stop = async () => { await closeHeldBrowsers(); process.exit(0); };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
  runner.listen().then(port => {
    const info = repoInfo(ROOT);
    console.log('');
    console.log('  Charter360 runner is on.');
    console.log(`  Pairing code:  ${runner.code}`);
    console.log(`  Repo folder:   ${ROOT}`);
    console.log(`  Branch:        ${info.branch || '(none)'}`);
    console.log(`  Listening on:  http://127.0.0.1:${port} (this computer only)`);
    console.log('');
    console.log('  Open Charter360 › Environment settings and type this code.');
    console.log('  Keep this window open while you test. Stop it with Ctrl+C.');
    if (process.env.NO_PUSH === '1') console.log('  NO_PUSH=1: runs are not committed or pushed.');
    if (process.env.HEADED === '0') console.log('  HEADED=0: browsers run hidden.');
    else console.log('  Each browser opens one window; every test is a new tab. Chrome stays open after a run (the next RUN closes it).');
    console.log('');
  }).catch(async e => {
    console.error(e.code === 'EADDRINUSE' ? await explainBusyPort() : e.message);
    process.exit(1);
  });
}
