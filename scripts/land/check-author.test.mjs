import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { HONOURED_ASSOCIATIONS, isHonouredAuthor } from './check-author.mjs'
import { HONOURED_ASSOCIATIONS as REVIEW_HONOURED_ASSOCIATIONS } from '../dispatch/review.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')

describe('OQ-81/AC-2: isHonouredAuthor', () => {
  it('an OWNER pull request is eligible', () => {
    expect(isHonouredAuthor('OWNER')).toBe(true)
  })

  it('a CONTRIBUTOR pull request is skipped', () => {
    expect(isHonouredAuthor('CONTRIBUTOR')).toBe(false)
  })

  it('a NONE pull request is skipped', () => {
    expect(isHonouredAuthor('NONE')).toBe(false)
  })

  it('a skipped pull request followed by an eligible one still lands', () => {
    const candidates = [
      { number: 10, author_association: 'CONTRIBUTOR' },
      { number: 11, author_association: 'OWNER' },
    ]
    const decisions = candidates.map((pr) => ({ number: pr.number, eligible: isHonouredAuthor(pr.author_association) }))
    expect(decisions).toEqual([
      { number: 10, eligible: false },
      { number: 11, eligible: true },
    ])
  })
})

describe('OQ-81/AC-3: the same set of associations everywhere', () => {
  const gate = readFileSync(path.join(ROOT, '.github', 'workflows', 'review-gate.yml'), 'utf8')
  const gateStep = gate.slice(gate.indexOf('name: Apply verdict from marker'))
  const gateHonoured = gateStep.match(/case "\$\{ASSOC\}" in\s+([A-Z|]+)\)/)[1].split('|')

  const landing = readFileSync(path.join(ROOT, '.github', 'workflows', 'land-approved.yml'), 'utf8')
  const landingHonoured = landing.match(/Honoured associations \(must match review-gate\.yml's ASSOC case\): ([A-Z|]+)/)[1].split('|')

  it('land-approved.yml names the same set review-gate.yml honours', () => {
    expect([...landingHonoured].sort()).toEqual([...gateHonoured].sort())
  })

  it('check-author.mjs honours the same set review-gate.yml honours', () => {
    expect([...HONOURED_ASSOCIATIONS].sort()).toEqual([...gateHonoured].sort())
  })

  it('review.mjs (OQ-78/AC-3) agrees with check-author.mjs, so all three agree', () => {
    expect([...REVIEW_HONOURED_ASSOCIATIONS].sort()).toEqual([...HONOURED_ASSOCIATIONS].sort())
  })

  it('land-approved.yml actually calls check-author.mjs', () => {
    expect(landing).toContain('scripts/land/check-author.mjs')
  })
})
