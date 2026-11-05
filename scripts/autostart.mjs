// npm run autostart      -> start the Charter360 runner by itself when you log in (Mac and Windows)
// npm run autostart:off  -> stop doing that
// The runner keeps its pairing code in .runner-code, so Charter360 stays paired after a restart.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const off = process.argv.includes('--off');
const node = process.execPath;
const runner = path.join(ROOT, 'runner', 'runner.mjs');
const label = 'pro.aiqe.charter360-runner';

export function macPlist({ node, runner, root, log, claudeCode }) {
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>${label}</string>
  <key>ProgramArguments</key><array><string>${esc(node)}</string><string>${esc(runner)}</string></array>
  <key>WorkingDirectory</key><string>${esc(root)}</string>
  <key>EnvironmentVariables</key><dict>
    <key>PATH</key><string>${esc(process.env.PATH || '/usr/bin:/bin')}</string>${claudeCode ? `
    <key>CHARTER360_CLAUDE_CODE</key><string>1</string>` : ''}
  </dict>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><false/>
  <key>StandardOutPath</key><string>${esc(log)}</string>
  <key>StandardErrorPath</key><string>${esc(log)}</string>
</dict></plist>
`;
}

export function windowsCmd({ node, runner, root, claudeCode }) {
  return `@echo off\r\nrem Starts the Charter360 runner at login (npm run autostart:off removes this file)\r\ncd /d "${root}"\r\n${claudeCode ? 'set CHARTER360_CLAUDE_CODE=1\r\n' : ''}start "Charter360 runner" /min "${node}" "${runner}"\r\n`;
}

function main() {
  const claudeCode = process.env.CHARTER360_CLAUDE_CODE === '1';
  if (process.platform === 'darwin') {
    const dir = path.join(os.homedir(), 'Library', 'LaunchAgents');
    const file = path.join(dir, `${label}.plist`);
    spawnSync('launchctl', ['unload', file], { stdio: 'ignore' });
    if (off) { fs.rmSync(file, { force: true }); console.log('✅ The runner no longer starts at login.'); return; }
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(file, macPlist({ node, runner, root: ROOT, log: path.join(ROOT, 'runner.log'), claudeCode }));
    const r = spawnSync('launchctl', ['load', file], { encoding: 'utf8' });
    if (r.status !== 0) { console.log(`❌ Couldn't turn it on: ${(r.stderr || '').trim()}`); process.exit(1); }
    console.log('✅ The runner now starts by itself when you log in (it is starting now too).\n   Its messages go to runner.log in this folder. To stop that: npm run autostart:off');
  } else if (process.platform === 'win32') {
    const dir = path.join(process.env.APPDATA || '', 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup');
    const file = path.join(dir, 'charter360-runner.cmd');
    if (off) { fs.rmSync(file, { force: true }); console.log('✅ The runner no longer starts at login.'); return; }
    fs.writeFileSync(file, windowsCmd({ node, runner, root: ROOT, claudeCode }));
    console.log('✅ The runner now starts by itself when you log in.\n   Start it now with: npm run runner   To stop that: npm run autostart:off');
  } else {
    console.log('Auto-start is for Mac and Windows. On Linux, add "npm run runner" to your startup applications.');
  }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
