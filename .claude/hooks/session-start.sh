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

# Circuit breaker notice (Open-Questions.md OQ-42). Many PRs blocked on review
# findings at once means something systemic is wrong, and starting more work
# multiplies it. This is advisory -- the enforced half lives in the review
# workflow -- so it is best-effort and never fails the hook.
#
# Note: GitHub's /search/issues API is not available to session tokens, so this
# lists the repo's open PRs and filters labels client-side.
breaker_threshold=5
if [ -n "${GITHUB_TOKEN:-}" ]; then
  slug="$(git config --get remote.origin.url 2>/dev/null \
    | sed -E 's#(git@github\.com:|https://github\.com/)##; s#\.git$##')"
  if [ -n "$slug" ]; then
    blocked="$(curl -fsS --max-time 15 \
      -H "Authorization: Bearer ${GITHUB_TOKEN}" \
      -H "Accept: application/vnd.github+json" \
      "https://api.github.com/repos/${slug}/pulls?state=open&per_page=100" 2>/dev/null \
      | python3 -c "import sys,json
try:
    d = json.load(sys.stdin)
    print(sum(1 for p in d if any(l['name'] == 'review-blocked' for l in p.get('labels', []))))
except Exception:
    print(0)" 2>/dev/null || echo 0)"
    if [ "${blocked:-0}" -ge "$breaker_threshold" ]; then
      echo ""
      echo "  !! $blocked open PRs are labelled review-blocked (threshold $breaker_threshold)."
      echo "  !! Do not start new feature work. Something systemic is likely wrong --"
      echo "  !! investigate the blocked PRs first. See Open-Questions.md OQ-42."
      echo ""
    fi
  fi
fi

echo "session-start: ready"
