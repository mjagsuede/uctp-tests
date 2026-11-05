#!/usr/bin/env bash
# setup-mac.sh -- gets this Mac ready for QE 360 Academy Session 6.
#
# What it does, in order. It checks each thing first and installs only what is missing,
# so it is safe to run again.
#   1. Git            (Apple's Command Line Tools; a window pops up, click Install)
#   2. Node.js LTS    (Homebrew if you have it, else the official installer from nodejs.org)  [admin]
#   3. Google Chrome  (installed by Playwright in step 7 if it is missing)                     [admin]
#   4. Firefox        (Homebrew if you have it; else Playwright's own Firefox is enough)
#   5. Your repo      (run this inside your uctp-tests folder, or give your repo URL: see below)
#   6. npm ci         (the project's packages)
#   7. Playwright browsers: Chrome (if missing), Firefox
#   8. npm run doctor (checks everything; all lines must be ✅)
# [admin] = your Mac asks for your password. If you are not an admin on this Mac, ask your IT admin.
#
# Run it:   bash setup-mac.sh
# No local copy of your repo yet?   bash setup-mac.sh https://github.com/<your-username>/uctp-tests.git
#           (it clones it to ~/uctp-tests and carries on there)
set -uo pipefail

step() { printf '\n\033[1m[%s/8] %s\033[0m\n' "$1" "$2"; }
ok()   { printf '   ✅ %s\n' "$1"; }
stop() { printf '\n   ❌ %s\n\nSetup stopped. Fix the line above, then run this script again (it skips what is done).\n' "$1"; exit 1; }

REPO_URL="${1:-}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ---- 1. Git ----
step 1 "Git"
if xcode-select -p >/dev/null 2>&1 && git --version >/dev/null 2>&1; then
  ok "$(git --version)"
else
  xcode-select --install >/dev/null 2>&1 || true
  stop "Git is not installed yet. A window has opened: click Install and wait until it says done (about 5-10 minutes). Then run this script again."
fi

# ---- 2. Node.js LTS ----
step 2 "Node.js (LTS)"
node_major() { node -p 'process.versions.node.split(".")[0]' 2>/dev/null || echo 0; }
if command -v node >/dev/null 2>&1 && [ "$(node_major)" -ge 20 ]; then
  ok "Node.js $(node -v)"
else
  if command -v brew >/dev/null 2>&1; then
    echo "   Installing Node.js 22 LTS with Homebrew..."
    brew install node@22 && brew link --overwrite --force node@22 || stop "Homebrew could not install Node.js. Install it from https://nodejs.org (the LTS button), then run this script again."
  else
    echo "   Downloading the official Node.js LTS installer from nodejs.org..."
    VER="$(curl -fsSL https://nodejs.org/dist/index.json | /usr/bin/python3 -c 'import json,sys; print(next(r["version"] for r in json.load(sys.stdin) if r["lts"]))' 2>/dev/null)"
    [ -n "$VER" ] || stop "Could not reach nodejs.org. Check your internet, or install Node.js LTS from https://nodejs.org yourself."
    TMP="$(mktemp -d)"
    curl -fsSL -o "$TMP/node.pkg" "https://nodejs.org/dist/$VER/node-$VER.pkg" || stop "The Node.js download failed. Check your internet and try again."
    SUM="$(curl -fsSL "https://nodejs.org/dist/$VER/SHASUMS256.txt" | awk -v f="node-$VER.pkg" '$2==f{print $1}')"
    [ -n "$SUM" ] && [ "$(shasum -a 256 "$TMP/node.pkg" | awk '{print $1}')" = "$SUM" ] || stop "The Node.js download did not match its checksum. Run this script again."
    echo "   Installing Node.js $VER (your Mac asks for your password: admin needed)..."
    sudo installer -pkg "$TMP/node.pkg" -target / || stop "Node.js did not install. You need to be an admin on this Mac: ask your IT admin, or install it from https://nodejs.org."
    rm -rf "$TMP"
  fi
  export PATH="/usr/local/bin:/opt/homebrew/bin:/opt/homebrew/opt/node@22/bin:$PATH"
  hash -r
  command -v node >/dev/null 2>&1 && [ "$(node_major)" -ge 20 ] || stop "Node.js is installed but this terminal can't see it yet. Close the terminal, open a new one, and run this script again."
  ok "Node.js $(node -v)"
fi

# ---- 3. Google Chrome ----
step 3 "Google Chrome"
NEED_CHROME=0
if [ -d "/Applications/Google Chrome.app" ] || [ -d "$HOME/Applications/Google Chrome.app" ]; then
  ok "Google Chrome is installed"
else
  NEED_CHROME=1
  echo "   Not installed yet: step 7 installs it (admin password needed)."
fi

# ---- 4. Firefox ----
step 4 "Firefox"
if [ -d "/Applications/Firefox.app" ]; then
  ok "Firefox is installed"
elif command -v brew >/dev/null 2>&1; then
  brew install --cask firefox && ok "Firefox installed" || echo "   Homebrew could not install Firefox. That's OK: the tests use Playwright's own Firefox (step 7)."
else
  ok "The tests use Playwright's own Firefox (step 7). You can open Charter360 in Chrome."
fi

# ---- 5. Your repo ----
step 5 "Your uctp-tests folder"
if [ -f "$SCRIPT_DIR/package.json" ] && [ -d "$SCRIPT_DIR/.git" ]; then
  cd "$SCRIPT_DIR"
elif [ -f "./package.json" ] && [ -d "./.git" ]; then
  :
elif [ -n "$REPO_URL" ]; then
  if [ -d "$HOME/uctp-tests/.git" ]; then
    cd "$HOME/uctp-tests"
  else
    git clone "$REPO_URL" "$HOME/uctp-tests" || stop "Could not clone $REPO_URL. Check the address (your copy: github.com/<your-username>/uctp-tests) and sign in to GitHub if asked."
    cd "$HOME/uctp-tests"
  fi
else
  stop "Run this script inside your uctp-tests folder, or give your repo address: bash setup-mac.sh https://github.com/<your-username>/uctp-tests.git"
fi
ok "$(pwd)"

# ---- 6. npm ci ----
step 6 "Project packages (npm ci)"
npm ci --no-audit --no-fund || stop "npm ci failed. Check your internet (a company proxy can block npm), then run this script again."
ok "Packages installed"

# ---- 7. Playwright browsers ----
step 7 "Playwright browsers"
if [ "$NEED_CHROME" = 1 ]; then
  echo "   Installing Google Chrome (your Mac asks for your password: admin needed)..."
  npx playwright install chrome || stop "Google Chrome did not install. Install it from https://www.google.com/chrome, then run this script again."
fi
npx playwright install firefox || stop "Playwright could not download its browsers. Check your internet, then run this script again."
ok "Chrome and Firefox ready"

# ---- 8. Doctor ----
step 8 "Check everything (npm run doctor)"
if npm run doctor; then
  printf '\nSetup done. Everything is ✅.\n'
else
  printf '\nSetup finished, but the doctor found something to fix (the ❌ lines above, each with its fix).\nFix them, then run: npm run doctor\n'
  exit 1
fi
