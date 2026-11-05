# setup-windows.ps1 -- gets this Windows 10/11 PC ready for QE 360 Academy Session 6.
#
# What it does, in order. It checks each thing first and installs only what is missing,
# so it is safe to run again.
#   1. Git            (winget install Git.Git)                                   [admin]
#   2. Node.js LTS    (winget install OpenJS.NodeJS.LTS)                         [admin]
#   3. Google Chrome  (installed by Playwright in step 7 if it is missing)       [admin]
#   4. Firefox        (winget install Mozilla.Firefox)
#   5. Your repo      (run this inside your uctp-tests folder, or give your repo URL: see below)
#   6. npm ci         (the project's packages)
#   7. Playwright browsers: Chrome (if missing), Firefox
#   8. npm run doctor (checks everything; all lines must be ✅)
# [admin] = Windows asks "Do you want to allow this app to make changes?". Click Yes.
#           If it asks for an admin password you don't have, ask your IT admin.
#
# Run it in PowerShell, inside your uctp-tests folder:
#   powershell -ExecutionPolicy Bypass -File .\setup-windows.ps1
# No local copy of your repo yet?
#   powershell -ExecutionPolicy Bypass -File .\setup-windows.ps1 https://github.com/<your-username>/uctp-tests.git
#   (it clones it to %USERPROFILE%\uctp-tests and carries on there)
param([string]$RepoUrl = '')
$ErrorActionPreference = 'Continue'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

function Step($n, $text) { Write-Host ''; Write-Host "[$n/8] $text" -ForegroundColor Cyan }
function Ok($text) { Write-Host "   ✅ $text" }
function Stop-Setup($text) {
  Write-Host ''; Write-Host "   ❌ $text" -ForegroundColor Red
  Write-Host ''; Write-Host 'Setup stopped. Fix the line above, then run this script again (it skips what is done).'
  exit 1
}
function Refresh-Path {
  $env:Path = [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [Environment]::GetEnvironmentVariable('Path', 'User')
}
function Has($cmd) { [bool](Get-Command $cmd -ErrorAction SilentlyContinue) }
function Need-Winget {
  if (-not (Has 'winget')) { Stop-Setup 'winget is missing. Install "App Installer" from the Microsoft Store (Windows 10/11), then run this script again.' }
}

# ---- 1. Git ----
Step 1 'Git'
if (Has 'git') { Ok (git --version) } else {
  Need-Winget
  Write-Host '   Installing Git (click Yes if Windows asks)...'
  winget install --id Git.Git -e --accept-source-agreements --accept-package-agreements
  Refresh-Path
  if (-not (Has 'git')) { Stop-Setup 'Git did not install. Close PowerShell, open a new one and run this script again. If it still fails, ask your IT admin to install Git.' }
  Ok (git --version)
}

# ---- 2. Node.js LTS ----
Step 2 'Node.js (LTS)'
function Node-Major { try { [int]((node -p "process.versions.node.split('.')[0]") 2>$null) } catch { 0 } }
if ((Has 'node') -and ((Node-Major) -ge 20)) { Ok "Node.js $(node -v)" } else {
  Need-Winget
  Write-Host '   Installing Node.js LTS (click Yes if Windows asks)...'
  winget install OpenJS.NodeJS.LTS -e --accept-source-agreements --accept-package-agreements
  Refresh-Path
  if (-not ((Has 'node') -and ((Node-Major) -ge 20))) { Stop-Setup 'Node.js is not ready. Close PowerShell, open a new one and run this script again. If it still fails, ask your IT admin to install Node.js LTS.' }
  Ok "Node.js $(node -v)"
}

# ---- 3. Google Chrome ----
Step 3 'Google Chrome'
$chromePaths = @("$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
                 "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
                 "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe")
$needChrome = -not ($chromePaths | Where-Object { $_ -and (Test-Path $_) })
if ($needChrome) { Write-Host '   Not installed yet: step 7 installs it (click Yes if Windows asks).' } else { Ok 'Google Chrome is installed' }

# ---- 4. Firefox ----
Step 4 'Firefox'
$ffPaths = @("$env:ProgramFiles\Mozilla Firefox\firefox.exe", "${env:ProgramFiles(x86)}\Mozilla Firefox\firefox.exe")
if ($ffPaths | Where-Object { $_ -and (Test-Path $_) }) { Ok 'Firefox is installed' } else {
  if (Has 'winget') {
    winget install Mozilla.Firefox -e --accept-source-agreements --accept-package-agreements
    if ($LASTEXITCODE -eq 0) { Ok 'Firefox installed' } else { Write-Host "   Firefox did not install. That's OK: the tests use Playwright's own Firefox (step 7)." }
  } else { Ok "The tests use Playwright's own Firefox (step 7)." }
}

# ---- 5. Your repo ----
Step 5 'Your uctp-tests folder'
if ((Test-Path "$PSScriptRoot\package.json") -and (Test-Path "$PSScriptRoot\.git")) { Set-Location $PSScriptRoot }
elseif ((Test-Path '.\package.json') -and (Test-Path '.\.git')) { }
elseif ($RepoUrl) {
  $dest = Join-Path $env:USERPROFILE 'uctp-tests'
  if (-not (Test-Path "$dest\.git")) {
    git clone $RepoUrl $dest
    if ($LASTEXITCODE -ne 0) { Stop-Setup "Could not clone $RepoUrl. Check the address (your copy: github.com/<your-username>/uctp-tests) and sign in to GitHub if asked." }
  }
  Set-Location $dest
} else { Stop-Setup 'Run this script inside your uctp-tests folder, or give your repo address: .\setup-windows.ps1 https://github.com/<your-username>/uctp-tests.git' }
Ok (Get-Location).Path

# ---- 6. npm ci ----
Step 6 'Project packages (npm ci)'
npm ci --no-audit --no-fund
if ($LASTEXITCODE -ne 0) { Stop-Setup 'npm ci failed. Check your internet (a company proxy can block npm), then run this script again.' }
Ok 'Packages installed'

# ---- 7. Playwright browsers ----
Step 7 'Playwright browsers'
if ($needChrome) {
  Write-Host '   Installing Google Chrome (click Yes if Windows asks)...'
  npx playwright install chrome
  if ($LASTEXITCODE -ne 0) { Stop-Setup 'Google Chrome did not install. Install it from https://www.google.com/chrome, then run this script again.' }
}
npx playwright install firefox
if ($LASTEXITCODE -ne 0) { Stop-Setup 'Playwright could not download its browsers. Check your internet, then run this script again.' }
Ok 'Chrome and Firefox ready'

# ---- 8. Doctor ----
Step 8 'Check everything (npm run doctor)'
npm run doctor
if ($LASTEXITCODE -eq 0) { Write-Host ''; Write-Host 'Setup done. Everything is ✅.' } else {
  Write-Host ''; Write-Host 'Setup finished, but the doctor found something to fix (the ❌ lines above, each with its fix).'
  Write-Host 'Fix them, then run: npm run doctor'
  exit 1
}
