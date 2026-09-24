import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import * as outcomeModule from './outcome.mjs'
import { classifySession, OUTCOMES, parsePrBlock } from './outcome.mjs'

const HERE = path.dirname(fileURLToPath(import.meta.url))

const PR_REPORT = [
  'Implemented the story. Pushed branch.',
  '',
  '## PR title',
  'Add outcome classifier',
  '',
  '## PR body',
  '### What changed',
  'A pure function.',
  '',
  '### Verification',
  '`npm test` passed.',
  '',
  'draft',
].join('\n')

function envelope(overrides = {}) {
  return {
    type: 'result',
    subtype: 'success',
    is_error: false,
    stop_reason: 'end_turn',
    result: PR_REPORT,
    total_cost_usd: 1.23,
    ...overrides,
  }
}

function record(overrides = {}, env = envelope()) {
  return {
    role: 'coder',
    exitCode: 0,
    signal: null,
    stdout: env === null ? '' : JSON.stringify(env),
    stoppedFor: null,
    ...overrides,
  }
}

describe('OQ-75/AC-1 classification', () => {
  it('OQ-75/AC-1 classifies a successful session as completed', () => {
    expect(classifySession(record()).outcome).toBe('completed')
  })

  it('OQ-75/AC-1 classifies each stop, exit and output shape', () => {
    const cases = [
      [record({ stoppedFor: 'timeout', signal: 'SIGTERM', exitCode: null }), 'timed-out'],
      [record({ stoppedFor: 'stall', signal: 'SIGTERM', exitCode: null }), 'stalled'],
      [record({ exitCode: 1 }, null), 'died'],
      [record({ signal: 'SIGKILL', exitCode: null }), 'died'],
      [record({}, envelope({ is_error: true })), 'died'],
      [record({}, envelope({ stop_reason: 'max_tokens' })), 'died'],
      [
        record({ exitCode: 1 }, envelope({ subtype: 'error_max_budget_usd', is_error: true })),
        'budget-exhausted',
      ],
      [record({ exitCode: 0 }, envelope({ subtype: 'error_max_budget_usd' })), 'budget-exhausted'],
      [record({}, null), 'malformed-output'],
      [record({ stdout: '{"type":"res' }), 'malformed-output'],
      [record({ stdout: 'not json at all' }), 'malformed-output'],
      [record({ stdout: '[1,2]' }), 'malformed-output'],
    ]
    for (const [rec, expected] of cases) {
      expect(classifySession(rec).outcome, JSON.stringify(rec)).toBe(expected)
    }
  })

  it('OQ-75/AC-1 keeps stalled and timed-out separate', () => {
    expect(classifySession(record({ stoppedFor: 'stall' })).outcome).not.toBe(
      classifySession(record({ stoppedFor: 'timeout' })).outcome,
    )
  })

  it('OQ-75/AC-1 never reports completed for a record that fits no positive rule', () => {
    const unrecognised = [
      {},
      { type: 'result' },
      { type: 'result', subtype: 'success' },
      { type: 'result', subtype: 'success', is_error: false, result: 'x' },
      { type: 'result', subtype: 'success', is_error: false, stop_reason: null, result: 'x' },
      { type: 'result', subtype: 'success', is_error: false, stop_reason: 'end_turn' },
      { type: 'assistant', subtype: 'success', is_error: false, stop_reason: 'end_turn', result: 'x' },
      envelope({ subtype: 'error_max_turns' }),
      envelope({ subtype: 'error_during_execution' }),
      envelope({ is_error: undefined }),
      envelope({ stop_reason: 'stop_sequence' }),
    ]
    for (const env of unrecognised) {
      expect(classifySession(record({}, env)).outcome, JSON.stringify(env)).not.toBe('completed')
    }
  })

  it('OQ-75/AC-1 returns only known outcomes and rejects a malformed record loudly', () => {
    expect(OUTCOMES).toContain(classifySession(record()).outcome)
    expect(() => classifySession(null)).toThrow(/object/)
    expect(() => classifySession(record({ role: 'janitor' }))).toThrow(/role/)
    expect(() => classifySession(record({ exitCode: '0' }))).toThrow(/exitCode/)
    expect(() => classifySession(record({ stdout: undefined }))).toThrow(/stdout/)
    expect(() => classifySession(record({ stoppedFor: 'bored' }))).toThrow(/stoppedFor/)
  })
})

describe('OQ-75/AC-2 non-completed asserts nothing about the work', () => {
  // The OQ-63 hand-run: session limit hit after the PR was already open.
  const sessionLimit = record(
    { exitCode: 1 },
    envelope({
      is_error: true,
      stop_reason: 'stop_sequence',
      result: `Session limit reached.\n\n${PR_REPORT}`,
    }),
  )

  it('OQ-75/AC-2 classifies the session-limit-after-PR case as not completed', () => {
    expect(classifySession(sessionLimit).outcome).not.toBe('completed')
    // Same case with a clean exit code: is_error alone is enough.
    expect(classifySession({ ...sessionLimit, exitCode: 0 }).outcome).not.toBe('completed')
  })

  it('OQ-75/AC-2 returns no field that claims anything about the branch or the PR', () => {
    const result = classifySession(sessionLimit)
    expect(Object.keys(result).sort()).toEqual(['envelope', 'outcome', 'prText', 'reason'])
    expect(result.reason).not.toMatch(/pushed|opened|no work|nothing happened/i)
    expect(Object.keys(classifySession({ ...sessionLimit, role: 'reviewer' })).sort()).toEqual([
      'envelope',
      'outcome',
      'reason',
    ])
  })
})

describe('OQ-75/AC-3 coder PR block', () => {
  it('OQ-75/AC-3 parses title, body and draft from a completed coder report', () => {
    const { prText } = classifySession(record())
    expect(prText).toEqual({
      status: 'parsed',
      title: 'Add outcome classifier',
      body: '### What changed\nA pure function.\n\n### Verification\n`npm test` passed.',
      draft: true,
    })
  })

  it('OQ-75/AC-3 parses ready, with markers in backticks and CRLF line endings', () => {
    const text = PR_REPORT.replace(/draft$/, '`ready`').replace(/\n/g, '\r\n') + '\r\n\r\n'
    expect(parsePrBlock(text)).toMatchObject({
      status: 'parsed',
      draft: false,
      title: 'Add outcome classifier',
    })
  })

  it('OQ-75/AC-3 uses the last block when the report mentions the headings earlier', () => {
    const text = `Prose.\n## PR title\nold\n## PR body\nold\n\n${PR_REPORT}`
    expect(parsePrBlock(text)).toMatchObject({ status: 'parsed', title: 'Add outcome classifier' })
  })

  it('OQ-75/AC-3 reports absent and malformed blocks rather than guessing', () => {
    expect(parsePrBlock('Just prose.')).toMatchObject({ status: 'absent' })
    expect(parsePrBlock(undefined)).toMatchObject({ status: 'absent' })
    expect(parsePrBlock('## PR title\nT\n\ndraft')).toMatchObject({ status: 'malformed' })
    expect(parsePrBlock('## PR title\nT\n## PR body\nB')).toMatchObject({ status: 'malformed' })
    expect(parsePrBlock('## PR title\nT\n## PR body\nB\nmaybe')).toMatchObject({
      status: 'malformed',
    })
    expect(parsePrBlock('## PR title\n\n## PR body\nB\nready')).toMatchObject({
      status: 'malformed',
    })
    expect(parsePrBlock('## PR title\nT\n## PR body\nready')).toMatchObject({ status: 'malformed' })
    const missing = classifySession(record({}, envelope({ result: 'done, no block' })))
    expect(missing.outcome).toBe('completed')
    expect(missing.prText).toMatchObject({ status: 'absent' })
    expect(missing.prText).not.toHaveProperty('body')
  })
})

describe('OQ-75/AC-4 envelope returned unaltered', () => {
  it('OQ-75/AC-4 returns the parsed JSON, deep-equal to what the session emitted', () => {
    const verdict = { verdict: 'block', head: 'a'.repeat(40), findings: [{ item: 3 }] }
    const env = envelope({ result: JSON.stringify(verdict), extra: { nested: [1, 2, { a: null }] } })
    const result = classifySession(record({ role: 'reviewer' }, env))
    expect(result.envelope).toEqual(env)
    expect(result.envelope.result).toBe(JSON.stringify(verdict))
  })

  it('OQ-75/AC-4 returns the envelope for a non-completed session, null when unparseable', () => {
    const env = envelope({ is_error: true })
    expect(classifySession(record({}, env)).envelope).toEqual(env)
    expect(classifySession(record({ stdout: 'garbage' })).envelope).toBeNull()
  })
})

describe('OQ-75/AC-5 module surface', () => {
  it('OQ-75/AC-5 exports only pure classification helpers and constants', () => {
    expect(Object.keys(outcomeModule).sort()).toEqual([
      'OUTCOMES',
      'RAW_RECORD_FIELDS',
      'ROLES',
      'STOPPED_FOR',
      'classifySession',
      'parsePrBlock',
      'validateRawRecord',
    ])
  })

  it('OQ-75/AC-5 imports nothing that could start a process or reach GitHub', () => {
    const source = readFileSync(path.join(HERE, 'outcome.mjs'), 'utf8')
    expect(source).not.toMatch(/^\s*import\b/m)
    expect(source).not.toMatch(/\bimport\s*\(/)
    expect(source).not.toMatch(/child_process|\bspawn|\bexec|\bfetch\b|\bprocess\.|require\(/)
  })
})
