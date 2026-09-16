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

# Playwright needs a chromium build matching the exact revision
# @playwright/test expects -- not merely "some chromium". Claude Code on the
# web pre-installs a build, but it is not necessarily that revision, and the
# sandbox network policy blocks cdn.playwright.dev, so the matching build
# cannot simply be downloaded. Ask Playwright itself where it expects its
# browser (no network, no download attempt); if that is missing, fall back to
# the image's pre-installed chromium, which drives Playwright correctly even
# at a different build number, via PLAYWRIGHT_CHROMIUM_EXECUTABLE. That
# variable is read by playwright.config.js and stays unset on local machines
# and in CI, where Playwright's own managed browser is used as usual.
browsers_path="${PLAYWRIGHT_BROWSERS_PATH:-$HOME/.cache/ms-playwright}"
expected_chromium="$(node -e \
  "import('@playwright/test').then(m => { try { console.log(m.chromium.executablePath()) } catch {} })" \
  2>/dev/null || true)"

if [ -n "$expected_chromium" ] && [ -x "$expected_chromium" ]; then
  echo "session-start: playwright's own chromium is present"
elif [ -x "$browsers_path/chromium" ]; then
  echo "session-start: playwright wants ${expected_chromium:-a chromium build} which is absent;"
  echo "session-start: falling back to pre-installed $browsers_path/chromium"
  if [ -n "${CLAUDE_ENV_FILE:-}" ]; then
    echo "export PLAYWRIGHT_CHROMIUM_EXECUTABLE=$browsers_path/chromium" >> "$CLAUDE_ENV_FILE"
  fi
else
  # No pre-installed browser to fall back on. Try a download -- it fails on a
  # restricted network, but succeeds on a permissive one, so it beats giving up.
  echo "session-start: no usable chromium found, attempting download"
  npx --yes playwright install chromium || \
    echo "session-start: chromium unavailable -- e2e tests cannot run in this session" >&2
fi

echo "session-start: ready"
