#!/bin/bash
# Prepares a Claude Code on the web container so lint, tests, the build and
# the Playwright e2e suite can run without the session spending its first
# turn on setup. Local checkouts are left alone -- they manage their own
# node_modules.
#
# Idempotent: safe to re-run. Registered as a SessionStart hook in
# .claude/settings.json.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-$(dirname "$0")/../..}"

# `npm install` rather than `npm ci` on purpose: the container image is
# cached after this hook completes, so an unchanged lockfile makes this a
# near-no-op on later sessions. `npm ci` would delete and rebuild
# node_modules every time.
#
# `--no-save` matters: the container's bundled npm is not necessarily the
# one that wrote package-lock.json, and an older npm silently rewrites the
# lockfile (e.g. stripping `libc` fields a newer npm records). Without it,
# every web session would start with a dirty lockfile and risk committing
# that churn into an unrelated PR.
npm install --no-save --no-fund --no-audit

# Playwright needs a chromium build. Claude Code on the web ships one
# pre-installed (PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers), so only
# download when the browser really is absent -- the download is ~150MB.
browsers_path="${PLAYWRIGHT_BROWSERS_PATH:-$HOME/.cache/ms-playwright}"
if compgen -G "$browsers_path/chromium-*" > /dev/null 2>&1; then
  echo "session-start: chromium already present in $browsers_path"
else
  echo "session-start: no chromium found in $browsers_path, installing"
  npx --yes playwright install chromium
fi

echo "session-start: ready"
