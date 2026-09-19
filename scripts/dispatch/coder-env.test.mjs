import { describe, expect, it } from 'vitest'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { coderAllowedTools, CODER_DISALLOWED_TOOLS, coderEnv } from './coder-env.mjs'

function hasGh() {
  try {
    execFileSync('gh', ['--version'])
    return true
  } catch {
    return false
  }
}

describe('coderEnv', () => {
  it('OQ-63/AC-1 - strips GH_TOKEN, so a status-setting call has no credential to use', () => {
    const env = coderEnv({ GH_TOKEN: 'a-real-looking-token', PATH: '/usr/bin' }, '/tmp/empty-gh-config')
    expect(env.GH_TOKEN).toBeUndefined()
  })

  it('OQ-63/AC-2 - strips GITHUB_TOKEN too, which gh and most GitHub clients also read', () => {
    const env = coderEnv({ GITHUB_TOKEN: 'a-real-looking-token' }, '/tmp/empty-gh-config')
    expect(env.GITHUB_TOKEN).toBeUndefined()
  })

  it('OQ-63/AC-3 - redirects GH_CONFIG_DIR away from any ambient gh login', () => {
    const env = coderEnv({ GH_CONFIG_DIR: '/home/owner/.config/gh' }, '/tmp/empty-gh-config')
    expect(env.GH_CONFIG_DIR).toBe('/tmp/empty-gh-config')
  })

  it('OQ-63/AC-4 - scrubs credentials regardless of what the ambient environment already carries', () => {
    // This is what node -e, npm run and npx inherit -- the *process*
    // environment, not the Bash tool's allowlist. If a credential survived
    // being copied from baseEnv here, it would survive being reached that
    // way too.
    const inheritedShell = { ...process.env, GH_TOKEN: 'inherited-from-a-logged-in-shell' }
    const env = coderEnv(inheritedShell, '/tmp/empty-gh-config')
    expect(env.GH_TOKEN).toBeUndefined()
    expect(env.GITHUB_TOKEN).toBeUndefined()
  })

  it('requires an empty gh config directory, since gh would otherwise fall back to its default', () => {
    expect(() => coderEnv({}, undefined)).toThrow()
  })

  it.skipIf(!hasGh())(
    'OQ-63/AC-1, AC-2, AC-4 - gh fails for want of authorisation once scrubbed, including via child_process',
    () => {
      const dir = mkdtempSync(path.join(tmpdir(), 'oq63-gh-config-'))
      try {
        const env = coderEnv(process.env, dir)

        // AC-1: setting a commit status. The SHA is invalid on purpose --
        // authorisation is checked before the payload is, so a 404/422 here
        // would mean this test is not exercising what it claims to.
        expect(() =>
          execFileSync(
            'gh',
            [
              'api', '-X', 'POST',
              'repos/luplows/tower-workshop-paths/statuses/0000000000000000000000000000000000000000',
              '-f', 'state=success',
            ],
            { env, stdio: 'pipe' },
          ),
        ).toThrow()

        // AC-2: dispatching a workflow.
        expect(() =>
          execFileSync(
            'gh',
            ['api', '-X', 'POST', 'repos/luplows/tower-workshop-paths/actions/workflows/land-approved.yml/dispatches', '-f', 'ref=main'],
            { env, stdio: 'pipe' },
          ),
        ).toThrow()

        // AC-4: the same call, made the way node -e would make it --
        // through child_process, never touching the Bash tool at all.
        expect(() =>
          execFileSync(
            process.execPath,
            [
              '-e',
              "require('child_process').execFileSync('gh', ['api','-X','POST','repos/luplows/tower-workshop-paths/statuses/0000000000000000000000000000000000000000','-f','state=success'], {stdio:'pipe'})",
            ],
            { env, stdio: 'pipe' },
          ),
        ).toThrow()
      } finally {
        rmSync(dir, { recursive: true, force: true })
      }
    },
  )
})

describe('coderAllowedTools', () => {
  it('OQ-63/AC-5 - scopes push to the exact assigned branch, not a wildcard', () => {
    const tools = coderAllowedTools('story/OQ-63-coder-write-capability')
    expect(tools).toContain('Bash(git push origin HEAD:story/OQ-63-coder-write-capability)')
    expect(tools).toContain('Bash(git push origin story/OQ-63-coder-write-capability:story/OQ-63-coder-write-capability)')
    expect(tools).not.toContain('Bash(git push:*)')
  })

  it('OQ-63/AC-5 - a different branch gets a different scoped pattern, never a shared one', () => {
    const a = coderAllowedTools('story/OQ-63-a')
    const b = coderAllowedTools('story/OQ-63-b')
    expect(a).not.toContain('Bash(git push origin HEAD:story/OQ-63-b)')
    expect(b).not.toContain('Bash(git push origin HEAD:story/OQ-63-a)')
  })

  it('requires the branch, since an unscoped push pattern would defeat AC-5', () => {
    expect(() => coderAllowedTools()).toThrow()
  })

  it('OQ-63/AC-1, AC-2, AC-3 - gh is not on the allowlist at all, having no legitimate use left', () => {
    const tools = coderAllowedTools('story/OQ-63-coder-write-capability')
    expect(tools.some((tool) => tool.startsWith('Bash(gh'))).toBe(false)
  })

  it('still grants the toolchain the coder needs to do its job (AC-5 "can still do its job")', () => {
    const tools = coderAllowedTools('story/OQ-63-coder-write-capability')
    for (const needed of ['Bash(npm:*)', 'Bash(npx:*)', 'Bash(node:*)', 'Read', 'Write', 'Edit']) {
      expect(tools).toContain(needed)
    }
  })
})

describe('CODER_DISALLOWED_TOOLS', () => {
  it('OQ-63/AC-1, AC-2, AC-3 - denies gh outright as defence in depth on top of coderEnv', () => {
    expect(CODER_DISALLOWED_TOOLS).toContain('Bash(gh:*)')
  })
})
