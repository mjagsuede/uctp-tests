// The learner's own AI, called from the runner on their laptop (Charter360 › Generate / Review, 2026-11-06).
// The key comes with each request from the learner's browser and is never written to disk or logged.
// Only these four hosts can be reached, so the runner can't be used to call anything else.
// claude-code: the laptop owner's own Claude plan through the Claude Code CLI (no key). It is OFF unless the owner
// starts the runner with CHARTER360_CLAUDE_CODE=1, and it only ever uses the account signed in on THIS laptop:
// the runner listens on 127.0.0.1 and needs the pairing code, so nobody else's browser can reach it.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
export const AI_PROVIDERS = {
  gemini: { label: 'Gemini API', model: 'gemini-2.5-flash' },
  anthropic: { label: 'Claude API', model: 'claude-sonnet-5-5' },
  openai: { label: 'ChatGPT API', model: 'gpt-5' },
  kimi: { label: 'Kimi API', model: 'kimi-k2-turbo-preview' },
  'claude-code': { label: 'Claude Code (my Claude plan)', model: '' },
};

function request(provider, { model, key, system, user, json }) {
  if (provider === 'gemini') {
    const body = { systemInstruction: { parts: [{ text: system }] }, contents: [{ role: 'user', parts: [{ text: user }] }],
      generationConfig: { maxOutputTokens: 65536, temperature: 0.2, ...(json ? { responseMimeType: 'application/json' } : {}) } };
    return { url: `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      headers: { 'x-goog-api-key': key }, body,
      read: d => (d.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join('') };
  }
  if (provider === 'anthropic') {
    return { url: 'https://api.anthropic.com/v1/messages',
      headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: { model, max_tokens: 32000, system, messages: [{ role: 'user', content: user }] },
      read: d => (d.content || []).filter(c => c.type === 'text').map(c => c.text).join('') };
  }
  const url = provider === 'openai' ? 'https://api.openai.com/v1/chat/completions' : 'https://api.moonshot.ai/v1/chat/completions';
  return { url, headers: { Authorization: `Bearer ${key}` },
    body: { model, messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
      ...(json ? { response_format: { type: 'json_object' } } : {}) },
    read: d => d.choices?.[0]?.message?.content || '' };
}

// Resolves { ok: true, text } or { ok: false, status, error } (the provider's own message). Never throws.
export async function askAi(input, { fetchImpl = fetch, timeoutMs = 5 * 60 * 1000, env = process.env, spawnImpl = spawn } = {}) {
  const p = AI_PROVIDERS[input.provider];
  if (!p) return { ok: false, status: 400, error: `provider must be one of: ${Object.keys(AI_PROVIDERS).join(', ')}.` };
  if (input.provider === 'claude-code') return askClaudeCode(input, { env, spawnImpl, timeoutMs });
  const key = String(input.key || '');
  if (!/^[\x21-\x7e]{10,300}$/.test(key)) return { ok: false, status: 400, error: 'Add your API key in Environment settings › My AI.' };
  const model = String(input.model || p.model);
  if (!/^[A-Za-z0-9._:-]{2,80}$/.test(model)) return { ok: false, status: 400, error: 'The model name looks wrong.' };
  const system = String(input.system || ''), user = String(input.user || '');
  if (!user.trim()) return { ok: false, status: 400, error: 'Nothing to send.' };
  const r = request(input.provider, { model, key, system, user, json: input.json === true });
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const res = await fetchImpl(r.url, { method: 'POST', headers: { 'Content-Type': 'application/json', ...r.headers },
      body: JSON.stringify(r.body), signal: ctl.signal });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = d.error?.message || d.message || (typeof d.error === 'string' ? d.error : '') || `${p.label} answered ${res.status}.`;
      return { ok: false, status: res.status, error: String(msg).slice(0, 500) };
    }
    const text = r.read(d);
    return text ? { ok: true, text } : { ok: false, status: 502, error: `${p.label} sent back nothing. Try again.` };
  } catch (e) {
    return { ok: false, status: 504, error: e.name === 'AbortError' ? `${p.label} took too long. Try again.` : `Couldn't reach ${p.label}. Check your connection.` };
  } finally { clearTimeout(timer); }
}

// The Claude Code CLI, isolated like the Academy's grader: an empty temporary folder, no tools, no MCP servers,
// no saved session, a clean environment (no CLAUDE* variables from a running session).
export function claudeCodeCommand(input, env = process.env) {
  const bin = env.CLAUDE_BIN || [path.join(env.HOME || os.homedir(), '.local', 'bin', 'claude')].find(f => fs.existsSync(f)) || 'claude';
  const args = ['-p', '--output-format', 'json', '--strict-mcp-config', '--no-session-persistence',
    '--setting-sources', 'project', '--tools', '', '--system-prompt', String(input.system || '')];
  const model = String(input.model || '');
  if (model) args.push('--model', model);
  const keep = ['PATH', 'HOME', 'USER', 'LOGNAME', 'LANG', 'LC_ALL', 'LC_CTYPE', 'TMPDIR', 'SHELL', 'TERM', 'USERPROFILE', 'APPDATA', 'LOCALAPPDATA', 'SystemRoot'];
  return { bin, args, env: Object.fromEntries(keep.filter(k => env[k]).map(k => [k, env[k]])) };
}

function askClaudeCode(input, { env, spawnImpl, timeoutMs }) {
  if (env.CHARTER360_CLAUDE_CODE !== '1') {
    return Promise.resolve({ ok: false, status: 403, error: 'Claude Code is off in this runner. Its owner can turn it on by starting the runner with CHARTER360_CLAUDE_CODE=1 npm run runner (it then uses the Claude plan signed in on that laptop only).' });
  }
  const model = String(input.model || '');
  if (model && !/^[A-Za-z0-9._:-]{2,80}$/.test(model)) return Promise.resolve({ ok: false, status: 400, error: 'The model name looks wrong.' });
  const user = String(input.user || '');
  if (!user.trim()) return Promise.resolve({ ok: false, status: 400, error: 'Nothing to send.' });
  const cmd = claudeCodeCommand(input, env);
  const jail = fs.mkdtempSync(path.join(os.tmpdir(), 'charter360-ai-'));
  return new Promise(resolve => {
    let out = '', done = false;
    const finish = r => { if (done) return; done = true; clearTimeout(timer); fs.rmSync(jail, { recursive: true, force: true }); resolve(r); };
    let child;
    try { child = spawnImpl(cmd.bin, cmd.args, { cwd: jail, env: cmd.env, stdio: ['pipe', 'pipe', 'pipe'] }); }
    catch { return finish({ ok: false, status: 502, error: 'Claude Code isn\'t installed on this laptop.' }); }
    const timer = setTimeout(() => { try { child.kill(); } catch { /* gone */ } finish({ ok: false, status: 504, error: 'Claude Code took too long. Try again.' }); }, timeoutMs);
    child.on('error', () => finish({ ok: false, status: 502, error: 'Claude Code isn\'t installed on this laptop (or not on PATH).' }));
    child.stdout.on('data', d => { out += d; });
    child.stderr.on('data', () => {});
    child.on('close', () => {
      let env2;
      try { env2 = JSON.parse(out); } catch { return finish({ ok: false, status: 502, error: 'Claude Code gave no answer. Run claude once in a terminal to check it works.' }); }
      const text = String(env2.result || '');
      if (env2.is_error) return finish({ ok: false, status: 502, error: /login/i.test(text) ? 'Claude Code is not signed in: run claude in a terminal, then /login.' : `Claude Code: ${text.slice(0, 300) || 'error'}` });
      finish(text ? { ok: true, text } : { ok: false, status: 502, error: 'Claude Code sent back nothing. Try again.' });
    });
    child.stdin.end(input.json === true ? user + '\n\nAnswer with JSON only.' : user);
  });
}
