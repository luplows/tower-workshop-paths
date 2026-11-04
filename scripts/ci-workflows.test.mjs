// @vitest-environment node

// The tests of this repository's own workflow files, moved here by OQ-148, so that they stayed when
// OQ-132 removed the old engine they sat beside.

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const SETUP_STEP_PREFIX = 'Setup: '

// AC-3: a text scan of ci.yml, deliberately not a YAML parser (the story's Constraints).
function testJobStepBlocks(text) {
  const lines = text.split(/\r?\n/)
  const stepsIdx = lines.findIndex((l) => /^ {4}steps:\s*$/.test(l))
  if (stepsIdx === -1) throw new Error('no "    steps:" found for the test job in ci.yml')
  const blocks = []
  let current = null
  for (let i = stepsIdx + 1; i < lines.length; i++) {
    const line = lines[i]
    if (/^ {6}- /.test(line)) {
      if (current) blocks.push(current.join('\n'))
      current = [line]
    } else if (current && (/^ {8,}/.test(line) || line.trim() === '')) {
      current.push(line)
    } else {
      break
    }
  }
  if (current) blocks.push(current.join('\n'))
  return blocks
}

function runTextOf(body) {
  const lines = body.split('\n')
  const idx = lines.findIndex((l) => /^ {8}run:/.test(l))
  if (idx === -1) return null
  const text = [lines[idx]]
  for (let i = idx + 1; i < lines.length; i++) {
    if (/^ {10,}/.test(lines[i]) || lines[i].trim() === '') text.push(lines[i])
    else break
  }
  return text.join('\n')
}

function fieldsOfStep(block) {
  // Normalise the dash onto the step's own 8-space key indentation, so a key
  // nested under `with:` (10 spaces) is never mistaken for the step's own.
  const body = block.replace(/^( {6})- /, '$1  ')
  const name = body.match(/^ {8}name:\s*(.+?)\s*$/m)?.[1]?.replace(/^['"]|['"]$/g, '')
  const uses = body.match(/^ {8}uses:\s*(\S+)/m)?.[1]
  return { name, uses, run: runTextOf(body) }
}

describe('OQ-118/AC-3: ci.yml names its setup steps with the AC-2 prefix, and only those', () => {
  const workflow = readFileSync(path.join(HERE, '..', '.github', 'workflows', 'ci.yml'), 'utf8')
  const steps = testJobStepBlocks(workflow).map(fieldsOfStep)

  it('every checkout, setup-node, cache, npm-ci or playwright-install step is named with the prefix, and no other step is', () => {
    let sawSetupStep = false
    for (const step of steps) {
      const isSetupKind =
        (step.uses !== undefined && /^actions\/(checkout|setup-node|cache)@/.test(step.uses)) ||
        (step.run !== null && (step.run.includes('npm ci') || step.run.includes('playwright install')))
      if (isSetupKind) {
        sawSetupStep = true
        expect(step.name, `expected ${JSON.stringify(step)} to be named with the ${JSON.stringify(SETUP_STEP_PREFIX)} prefix`).toMatch(
          new RegExp(`^${SETUP_STEP_PREFIX}`),
        )
      } else {
        expect(
          step.name?.startsWith(SETUP_STEP_PREFIX) ?? false,
          `step ${JSON.stringify(step)} is named with the ${JSON.stringify(SETUP_STEP_PREFIX)} prefix but is not a setup step`,
        ).toBe(false)
      }
    }
    expect(sawSetupStep, 'found no setup step in ci.yml at all').toBe(true)
  })
})

const CI_WORKFLOW_FILE = path.join(HERE, '..', '.github', 'workflows', 'ci.yml')
const SCREENSHOTS_WORKFLOW_FILE = path.join(HERE, '..', '.github', 'workflows', 'update-screenshots.yml')
const OQ117_WORKFLOWS = [
  ['ci.yml', CI_WORKFLOW_FILE],
  ['update-screenshots.yml', SCREENSHOTS_WORKFLOW_FILE],
]

function installStepOf(text) {
  const blocks = testJobStepBlocks(text)
  const fields = blocks.map(fieldsOfStep)
  const idx = fields.findIndex((f) => f.name === 'Setup: Playwright browsers')
  if (idx === -1) throw new Error('no "Setup: Playwright browsers" step found')
  return blocks[idx]
}

describe('OQ-117/AC-1: the browser cache is keyed on the runner OS and the locked @playwright/test version', () => {
  const lockfile = JSON.parse(readFileSync(path.join(HERE, '..', 'package-lock.json'), 'utf8'))
  const lockedVersion = lockfile.packages['node_modules/@playwright/test'].version

  it('the version resolved from package-lock.json today is the installed @playwright/test version', () => {
    expect(lockedVersion).toBe('1.63.0')
  })

  for (const [label, file] of OQ117_WORKFLOWS) {
    it(`${label} resolves the version from package-lock.json (not package.json's range) and caches ~/.cache/ms-playwright on runner.os and that version`, () => {
      const text = readFileSync(file, 'utf8')
      expect(text).toContain("require('./package-lock.json')")
      expect(text).toContain("packages['node_modules/@playwright/test'].version")
      expect(text).not.toContain("require('./package.json')")
      expect(text).toContain('path: ~/.cache/ms-playwright')
      expect(text).toContain('key: ${{ runner.os }}-playwright-${{ steps.playwright-version.outputs.version }}')
    })
  }
})

describe('OQ-117/AC-2: a cache hit installs only system packages; a miss installs the browser too', () => {
  for (const [label, file] of OQ117_WORKFLOWS) {
    it(`${label}'s install step branches on steps.playwright-cache.outputs.cache-hit`, () => {
      const block = installStepOf(readFileSync(file, 'utf8'))
      expect(block).toContain('steps.playwright-cache.outputs.cache-hit')
      expect(block).toMatch(/cmd="npx playwright install-deps chromium"/)
      expect(block).toMatch(/cmd="npx playwright install --with-deps chromium"/)
    })
  }
})

describe('OQ-117/AC-3: the install step tries at most twice, each try bounded within the step limit, logging which try runs', () => {
  for (const [label, file] of OQ117_WORKFLOWS) {
    it(`${label}'s install step runs at most 2 tries of 2 minutes each (<= its 6-minute timeout-minutes, OQ-140/AC-4), naming each try`, () => {
      const block = installStepOf(readFileSync(file, 'utf8'))
      expect(block).toMatch(/for attempt in 1 2; do/)
      expect(block).toContain('echo "Playwright install attempt $attempt of 2"')
      const tries = 2 // "for attempt in 1 2" above
      const perTryMinutesMatches = [...block.matchAll(/timeout (\d+)m /g)].map((m) => Number(m[1]))
      expect(perTryMinutesMatches).toEqual([2]) // one `timeout …m` call inside the loop, run once per try
      const stepTimeout = Number(block.match(/timeout-minutes: (\d+)/)[1])
      expect(stepTimeout).toBe(6)
      expect(perTryMinutesMatches[0] * tries).toBeLessThanOrEqual(stepTimeout)
    })
  }
})

describe('OQ-117/AC-4: the install step limits itself to 6 minutes (5 until OQ-140), and the job limits itself to 20', () => {
  for (const [label, file] of OQ117_WORKFLOWS) {
    it(`${label} sets job timeout-minutes: 20 and the install step's own timeout-minutes: 6`, () => {
      const text = readFileSync(file, 'utf8')
      expect(text).toMatch(/^ {4}timeout-minutes: 20$/m)
      const block = installStepOf(text)
      expect(block).toMatch(/timeout-minutes: 6/)
    })
  }
})

describe('OQ-136/AC-1: a try that fails or reaches its limit stops every process it started, apt-get and dpkg under sudo included', () => {
  for (const [label, file] of OQ117_WORKFLOWS) {
    it(`${label}'s install step snapshots pids before each try, after it picks the new ones whose process group or session is new too, kills (plain then sudo) whatever is still alive, and logs which pids or that none were found`, () => {
      const block = installStepOf(readFileSync(file, 'utf8'))
      expect(block).toContain(`before_pids="$(ps -eo pid= | tr -d ' ')"`)
      expect(block).toContain(`leftover="$(awk '`)
      expect(block).toContain('!($1 in old) && (!($2 in old) || !($3 in old)) { print $1 }')
      expect(block).toContain(`' <(echo "$before_pids") <(ps -eo pid=,pgid=,sid=))"`)
      expect(block).toContain('kill -9 "$pid" 2>/dev/null || sudo kill -9 "$pid" 2>/dev/null || true')
      expect(block).toContain('echo "Stopping leftover processes from attempt $attempt: $leftover"')
      expect(block).toContain('echo "No leftover processes from attempt $attempt"')
    })
  }
})

describe('OQ-136/AC-2: before the second try, the step waits at most 30s for the dpkg package lock and then repairs any half-finished install', () => {
  for (const [label, file] of OQ117_WORKFLOWS) {
    it(`${label}'s install step waits on /var/lib/dpkg/lock-frontend for at most 30s with an fcntl probe, logs how long it waited, then runs sudo dpkg --configure -a for at most 20s without failing the step`, () => {
      const block = installStepOf(readFileSync(file, 'utf8'))
      expect(block).toMatch(/if \[ "\$attempt" -eq 1 \]; then/)
      expect(block).toContain('dpkg_lock=/var/lib/dpkg/lock-frontend')
      expect(block).toContain(
        `probe='import fcntl, sys; fcntl.lockf(open(sys.argv[1], "a"), fcntl.LOCK_EX | fcntl.LOCK_NB)'`,
      )
      expect(block).toContain('while [ "$waited" -lt 30 ] && ! sudo python3 -c "$probe" "$dpkg_lock" 2>/dev/null; do')
      expect(block).not.toContain('flock -n') // the old probe, blind to apt's and dpkg's fcntl lock
      expect(block).toContain('echo "Waited ${waited}s for $dpkg_lock"')
      expect(block).toContain('if ! sudo timeout 20s dpkg --configure -a; then')
      expect(block).toContain('echo "dpkg --configure -a failed or ran past 20s; making the second try anyway"')
    })
  }
})

// The allowance for the clean-up after the first try, which install-cleanup.alone.test.mjs holds
// the clean-up to (OQ-140/AC-6).
const CLEANUP_ALLOWANCE_SECONDS = 5

describe('OQ-136/AC-3, as OQ-140/AC-5 counts it: everything that runs before the second try ends (the cached files copy, two tries, the clean-up allowance, the wait, the repair and the mirror switch) fits inside the 6-minute step timeout', () => {
  for (const [label, file] of OQ117_WORKFLOWS) {
    it(`${label} still tries at most twice at timeout 2m each, keeps the job's timeout-minutes: 20, and its worst case before the second try ends, 10 + 2 × 120 + 5 + 30 + 20 + 10 = 315 seconds, is below the step's timeout-minutes: 6`, () => {
      const text = readFileSync(file, 'utf8')
      const block = installStepOf(text)
      expect(block).toMatch(/for attempt in 1 2; do/)
      const perTryMinutesMatches = [...block.matchAll(/timeout (\d+)m /g)].map((m) => Number(m[1]))
      expect(perTryMinutesMatches).toEqual([2]) // unchanged from OQ-117: one `timeout …m` call, run once per try
      const stepTimeout = Number(block.match(/timeout-minutes: (\d+)/)[1])
      expect(stepTimeout).toBe(6)
      expect(text).toMatch(/^ {4}timeout-minutes: 20$/m)
      const waitCapMatches = [...block.matchAll(/waited" -lt (\d+)/g)].map((m) => Number(m[1]))
      expect(waitCapMatches).toEqual([30])
      const repairCapMatches = [...block.matchAll(/timeout (\d+)s dpkg --configure -a/g)].map((m) => Number(m[1]))
      expect(repairCapMatches).toEqual([20])
      const copyCapMatches = [...block.matchAll(/timeout (\d+)s cp /g)].map((m) => Number(m[1]))
      expect(copyCapMatches).toEqual([10])
      const switchCapMatches = [...block.matchAll(/timeout (\d+)s sh -c /g)].map((m) => Number(m[1]))
      expect(switchCapMatches).toEqual([10])
      const tries = 2
      const worstCaseSeconds =
        copyCapMatches[0] +
        perTryMinutesMatches[0] * 60 * tries +
        CLEANUP_ALLOWANCE_SECONDS +
        waitCapMatches[0] +
        repairCapMatches[0] +
        switchCapMatches[0]
      expect(worstCaseSeconds).toBe(315)
      expect(worstCaseSeconds).toBeLessThan(stepTimeout * 60)
    })
  }
})

describe('OQ-140/AC-1: a cache of apt package files is restored before the install step, and its files are copied into /var/cache/apt/archives/ before the first try', () => {
  for (const [label, file] of OQ117_WORKFLOWS) {
    it(`${label} restores ~/apt-archives with actions/cache/restore@v4 on a key of runner.os, ImageOS, ImageVersion and the Playwright version, and the install step copies the .deb files under sudo timeout 10s before the loop, not fatally`, () => {
      const text = readFileSync(file, 'utf8')
      const fields = testJobStepBlocks(text).map(fieldsOfStep)
      const installAt = fields.findIndex((f) => f.name === 'Setup: Playwright browsers')
      const keyAt = fields.findIndex((f) => f.name === 'Resolve apt package cache key')
      const restoreAt = fields.findIndex((f) => f.name === 'Restore apt package cache')
      expect(keyAt).toBeGreaterThan(-1)
      expect(restoreAt).toBeGreaterThan(keyAt)
      expect(restoreAt).toBeLessThan(installAt)
      const blocks = testJobStepBlocks(text)
      expect(blocks[restoreAt]).toContain('uses: actions/cache/restore@v4')
      expect(blocks[restoreAt]).toContain('path: ~/apt-archives')
      expect(blocks[restoreAt]).toContain('key: ${{ steps.apt-cache-key.outputs.key }}')
      expect(blocks[keyAt]).toContain(
        'key=${{ runner.os }}-apt-${ImageOS}-${ImageVersion}-playwright-${{ steps.playwright-version.outputs.version }}',
      )
      const install = blocks[installAt]
      expect(install).toContain('if [ "${{ steps.apt-cache.outputs.cache-hit }}" = "true" ]; then')
      expect(install).toContain('if sudo timeout 10s cp "$apt_cache"/*.deb /var/cache/apt/archives/; then')
      expect(install).toContain(
        `echo "Copied $(find "$apt_cache" -name '*.deb' | wc -l) cached .deb files into /var/cache/apt/archives/"`,
      )
      expect(install).toContain(
        'echo "Copying the cached .deb files failed or ran past 10s; making the first try anyway"',
      )
      expect(install.indexOf('sudo timeout 10s cp')).toBeLessThan(install.indexOf('for attempt in 1 2; do'))
    })
  }
})

describe('OQ-140/AC-2: when the install succeeds and the cache was not restored, the .deb files are copied and saved under the same key', () => {
  for (const [label, file] of OQ117_WORKFLOWS) {
    it(`${label} collects /var/cache/apt/archives/*.deb into ~/apt-archives and saves it with actions/cache/save@v4, both only when apt-cache's cache-hit is not 'true' and only after the install step succeeds`, () => {
      const text = readFileSync(file, 'utf8')
      const blocks = testJobStepBlocks(text)
      const fields = blocks.map(fieldsOfStep)
      const installAt = fields.findIndex((f) => f.name === 'Setup: Playwright browsers')
      const collectAt = fields.findIndex((f) => f.name === 'Collect apt package files for the cache')
      const saveAt = fields.findIndex((f) => f.name === 'Save apt package cache')
      expect(collectAt).toBe(installAt + 1)
      expect(saveAt).toBe(collectAt + 1)
      for (const at of [collectAt, saveAt]) {
        // No `always()` or `failure()`: the default success() leaves a failed install saving nothing.
        expect(blocks[at]).toContain("if: steps.apt-cache.outputs.cache-hit != 'true'")
        expect(blocks[at]).not.toMatch(/always\(\)|failure\(\)/)
      }
      expect(blocks[collectAt]).toContain("find /var/cache/apt/archives -maxdepth 1 -name '*.deb' -exec cp -t ~/apt-archives {} +")
      expect(blocks[saveAt]).toContain('uses: actions/cache/save@v4')
      expect(blocks[saveAt]).toContain('path: ~/apt-archives')
      expect(blocks[saveAt]).toContain('key: ${{ steps.apt-cache-key.outputs.key }}')
    })
  }
})

describe('OQ-140/AC-3: before the second try, after the wait and the repair, apt is pointed at archive.ubuntu.com in place of the runner mirror list', () => {
  for (const [label, file] of OQ117_WORKFLOWS) {
    it(`${label} logs /etc/apt/apt-mirrors.txt before and after, switches it under sudo timeout 10s, and makes the second try if the switch fails`, () => {
      const block = installStepOf(readFileSync(file, 'utf8'))
      const repairAt = block.indexOf('sudo timeout 20s dpkg --configure -a')
      const switchAt = block.indexOf('sudo timeout 10s sh -c')
      expect(repairAt).toBeGreaterThan(-1)
      expect(switchAt).toBeGreaterThan(repairAt)
      expect(block.indexOf('for attempt in 1 2; do')).toBeLessThan(switchAt)
      expect(block.indexOf('if [ "$attempt" -eq 1 ]; then')).toBeLessThan(switchAt) // inside the first try's block
      expect(block).toContain('mirror_list=/etc/apt/apt-mirrors.txt')
      expect(block).toContain('echo "$mirror_list before the switch:"')
      expect(block).toContain('echo "$mirror_list after the switch:"')
      expect(block).toContain(
        `if ! sudo timeout 10s sh -c 'echo "http://archive.ubuntu.com/ubuntu/" > "$0"' "$mirror_list"; then`,
      )
      expect(block).toContain('echo "Switching $mirror_list failed or ran past 10s; making the second try anyway"')
      // before < switch < after, in the order the log should show
      expect(block.indexOf('before the switch')).toBeLessThan(switchAt)
      expect(block.indexOf('after the switch')).toBeGreaterThan(switchAt)
    })
  }
})

describe('OQ-140/AC-4: the install step limit is 6 minutes, and the per-try, wait, repair and job limits are unchanged', () => {
  for (const [label, file] of OQ117_WORKFLOWS) {
    it(`${label} sets the step's timeout-minutes: 6, with timeout 2m per try, a 30s wait, a 20s repair and the job's timeout-minutes: 20`, () => {
      const text = readFileSync(file, 'utf8')
      const block = installStepOf(text)
      expect(block).toMatch(/^ {8}timeout-minutes: 6$/m)
      expect(block).not.toMatch(/timeout-minutes: 5/)
      expect([...block.matchAll(/timeout (\d+)m /g)].map((m) => Number(m[1]))).toEqual([2])
      expect(block).toContain('while [ "$waited" -lt 30 ]')
      expect(block).toContain('sudo timeout 20s dpkg --configure -a')
      expect(text).toMatch(/^ {4}timeout-minutes: 20$/m)
    })
  }
})

describe('OQ-136/AC-4: the clean-up test runs alone, outside npm test, in a CI step of its own', () => {
  it('vite.config.js leaves *.alone.test.mjs out unless VITEST_ALONE=1, and ci.yml runs the clean-up test with it after npm test', () => {
    const config = readFileSync(path.join(HERE, '..', 'vite.config.js'), 'utf8')
    expect(config).toContain("...(process.env.VITEST_ALONE === '1' ? [] : ['**/*.alone.test.mjs'])")
    const blocks = testJobStepBlocks(readFileSync(CI_WORKFLOW_FILE, 'utf8'))
    const steps = blocks.map(fieldsOfStep)
    // runTextOf keeps the `run:` key on its first line.
    const npmTestAt = steps.findIndex((s) => s.run?.trim() === 'run: npm test')
    const aloneAt = steps.findIndex((s) => s.name === 'Run the install clean-up test alone (OQ-136)')
    expect(npmTestAt).toBeGreaterThan(-1)
    expect(aloneAt).toBe(npmTestAt + 1)
    expect(steps[aloneAt].run.trim()).toBe('run: npx vitest run scripts/install-cleanup.alone.test.mjs')
    expect(blocks[aloneAt]).toMatch(/^ {8}env:\n {10}VITEST_ALONE: '1'$/m)
  })
})

// OQ-124: both workflow files, scanned as text per the story's Constraints.
const DEPLOY_WORKFLOW_FILE = path.join(HERE, '..', '.github', 'workflows', 'deploy-pages.yml')
const OQ124_SKIP_IF = "if: github.event_name != 'workflow_run' || github.event.workflow_run.head_sha != github.sha"

// The workflow name a `workflow_run` trigger must match, as a literal since OQ-148: the file that
// names it is steward's, and is absent between OQ-132 and OQ-115.
const sweepName = 'Land approved PRs'

function workflowRunTriggerOf(text) {
  const m = text.match(/^on:\n([\s\S]*?)^\S/m)
  return (m ? m[1] : text).match(/ {2}workflow_run:\n([\s\S]*?)(?=\n {2}\S|\n\S|$)/)?.[0] ?? null
}

// All step blocks of every job in the file, not just the first job's (AC-4 needs every
// checkout step, and deploy-pages.yml has two jobs).
function allStepBlocks(text) {
  const lines = text.split(/\r?\n/)
  const blocks = []
  for (let i = 0; i < lines.length; i++) {
    if (!/^ {4}steps:\s*$/.test(lines[i])) continue
    let current = null
    for (let j = i + 1; j < lines.length; j++) {
      const line = lines[j]
      if (/^ {6}- /.test(line)) {
        if (current) blocks.push(current.join('\n'))
        current = [line]
      } else if (current && (/^ {8,}/.test(line) || line.trim() === '')) {
        current.push(line)
      } else {
        break
      }
    }
    if (current) blocks.push(current.join('\n'))
  }
  return blocks
}

// A job block: its own line through the line before the next top-level (2-space) job key.
function jobBlock(text, jobName) {
  const lines = text.split(/\r?\n/)
  const start = lines.findIndex((l) => new RegExp(`^ {2}${jobName}:\\s*$`).test(l))
  if (start === -1) throw new Error(`no job "${jobName}" found`)
  const block = [lines[start]]
  for (let i = start + 1; i < lines.length; i++) {
    if (/^ {2}\S/.test(lines[i])) break
    block.push(lines[i])
  }
  return block.join('\n')
}

describe('OQ-124/AC-1: ci.yml also triggers on workflow_run of the sweep, completed; pull_request and push unchanged', () => {
  const text = readFileSync(CI_WORKFLOW_FILE, 'utf8')

  it('keeps the existing pull_request and push triggers', () => {
    expect(text).toMatch(/^on:\n {2}pull_request:\n {4}branches: \[main\]\n {2}push:\n {4}branches: \[main\]\n/m)
  })

  it(`adds workflow_run on "${sweepName}", types: [completed]`, () => {
    const trigger = workflowRunTriggerOf(text)
    expect(trigger).not.toBeNull()
    expect(trigger).toContain(`workflows: [${sweepName}]`)
    expect(trigger).toContain('types: [completed]')
  })
})

describe('OQ-124/AC-2: deploy-pages.yml also triggers on the same workflow_run; push and workflow_dispatch unchanged', () => {
  const text = readFileSync(DEPLOY_WORKFLOW_FILE, 'utf8')

  it('keeps the existing push and workflow_dispatch triggers', () => {
    expect(text).toMatch(/^on:\n {2}push:\n {4}branches: \[main\]\n {2}workflow_dispatch:\n/m)
  })

  it(`adds workflow_run on "${sweepName}", types: [completed]`, () => {
    const trigger = workflowRunTriggerOf(text)
    expect(trigger).not.toBeNull()
    expect(trigger).toContain(`workflows: [${sweepName}]`)
    expect(trigger).toContain('types: [completed]')
  })
})

describe('OQ-124/AC-3: every job with no needs: carries the exact skip condition; a job with needs: is left without one', () => {
  it("ci.yml's test job (no needs:) carries the exact if:", () => {
    const block = jobBlock(readFileSync(CI_WORKFLOW_FILE, 'utf8'), 'test')
    expect(block).not.toMatch(/^ {4}needs:/m)
    expect(block).toContain(OQ124_SKIP_IF)
  })

  it("deploy-pages.yml's build job (no needs:) carries the exact if:, and deploy (needs: build) carries none", () => {
    const text = readFileSync(DEPLOY_WORKFLOW_FILE, 'utf8')
    const build = jobBlock(text, 'build')
    expect(build).not.toMatch(/^ {4}needs:/m)
    expect(build).toContain(OQ124_SKIP_IF)
    const deploy = jobBlock(text, 'deploy')
    expect(deploy).toMatch(/^ {4}needs: build\s*$/m)
    expect(deploy).not.toContain(OQ124_SKIP_IF)
  })
})

describe('OQ-124/AC-4: no checkout step is given a ref:, so a workflow_run run checks out github.sha', () => {
  for (const [label, file] of [
    ['ci.yml', CI_WORKFLOW_FILE],
    ['deploy-pages.yml', DEPLOY_WORKFLOW_FILE],
  ]) {
    it(`${label}'s checkout step(s) take no ref:`, () => {
      const blocks = allStepBlocks(readFileSync(file, 'utf8'))
      const checkoutBlocks = blocks.filter((b) => /uses: actions\/checkout@/.test(b))
      expect(checkoutBlocks.length).toBeGreaterThan(0)
      for (const block of checkoutBlocks) {
        expect(block).not.toMatch(/^\s*ref:/m)
      }
    })
  }
})
