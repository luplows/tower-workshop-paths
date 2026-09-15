import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { ENHANCEMENT_CATEGORIES } from '../data/enhancementCategories'
import { WORKSHOP_CATEGORIES } from '../data/workshopCategories'
import { WORKSHOP_UNLOCK_GROUPS } from '../data/workshopUnlockGroups'
import { unlockGroupKey } from '../utils/workshopUnlockGroups'
import { UpgradePath } from './UpgradePath'

const maxedWorkshopLevels = () => {
  const levels = {}
  for (const category of WORKSHOP_CATEGORIES) {
    for (const upgrade of category.upgrades) levels[upgrade.name] = upgrade.quantity
  }
  return levels
}

const maxedEnhancementLevels = () => {
  const levels = {}
  for (const category of ENHANCEMENT_CATEGORIES) {
    for (const upgrade of category.upgrades) levels[upgrade.name] = upgrade.quantity
  }
  return levels
}

const allUnlockedGroups = () => {
  const unlocked = {}
  for (const [categoryId, groups] of Object.entries(WORKSHOP_UNLOCK_GROUPS)) {
    for (const group of groups) unlocked[unlockGroupKey(categoryId, group.name)] = true
  }
  return unlocked
}

describe('UpgradePath', () => {
  beforeEach(() => {
    window.localStorage.clear()
    // Every Workshop upgrade-unlock group already purchased (OQ-5) --
    // most of these tests are about ranking/buying itself, not the unlock
    // gate (see its own describe block below).
    window.localStorage.setItem('workshopUnlockedGroups', JSON.stringify(allUnlockedGroups()))
  })

  it('shows the cheapest not-yet-maxed upgrade first, with its batch cost and level jump (OQ-7)', () => {
    render(<UpgradePath />)

    const rows = screen.getAllByRole('listitem')
    expect(rows[0]).toHaveTextContent('Multishot Targets')
    expect(rows[0]).toHaveTextContent('450 coins')
    expect(rows[0]).toHaveTextContent('Lv 0 → 1')
  })

  it('reflects a level entered on the Workshop screen when ranking', () => {
    window.localStorage.setItem('workshopLevels', JSON.stringify({ 'Attack Speed': 1 }))
    render(<UpgradePath />)

    // Attack Speed can legitimately appear more than once (OQ-19) -- its
    // first, cheapest occurrence should start from the entered level,
    // batched 10 levels at a time since its max level is under 1000 (OQ-7).
    const row = screen.getAllByText('Attack Speed')[0].closest('li')
    expect(row).toHaveTextContent('Lv 1 → 11')
  })

  it('lists an upgrade with unavailable cost data separately, not in the ranked list', () => {
    window.localStorage.setItem('workshopLevels', JSON.stringify({ Health: 5000 }))
    render(<UpgradePath />)

    const list = screen.getByRole('list', { name: 'Recommended buy order' })
    expect(within(list).queryByText('Health')).not.toBeInTheDocument()
    expect(screen.getByText(/Cost data unavailable/)).toBeInTheDocument()
    expect(screen.getByText('Health (Lv 5000)')).toBeInTheDocument()
  })

  it("buying a row adds its batch size to the upgrade's entered level and re-ranks (OQ-18)", async () => {
    const user = userEvent.setup()
    render(<UpgradePath />)

    const rows = screen.getAllByRole('listitem')
    expect(rows[0]).toHaveTextContent('Multishot Targets')

    await user.click(
      within(rows[0]).getByRole('button', {
        name: 'Buy 1 level of Multishot Targets for 450 coins',
      }),
    )

    // Buying the cheapest 1-level batch (Lv 0 -> 1) advances the entered
    // level and re-ranks: the next-cheapest row (Bounce Shot Targets) is
    // now first.
    expect(
      JSON.parse(window.localStorage.getItem('workshopLevels')),
    ).toEqual({ 'Multishot Targets': 1 })
    const rowsAfter = screen.getAllByRole('listitem')
    expect(rowsAfter[0]).toHaveTextContent('Bounce Shot Targets')
  })

  it('adds to (not overwrites) an already-entered level when buying (OQ-18)', async () => {
    window.localStorage.setItem('workshopLevels', JSON.stringify({ 'Attack Speed': 1 }))
    const user = userEvent.setup()
    render(<UpgradePath />)

    const row = screen.getAllByText('Attack Speed')[0].closest('li')
    expect(row).toHaveTextContent('Lv 1 → 11')

    await user.click(
      within(row).getByRole('button', {
        name: 'Buy 10 levels of Attack Speed for 3.78k coins',
      }),
    )

    expect(
      JSON.parse(window.localStorage.getItem('workshopLevels'))['Attack Speed'],
    ).toBe(11)
  })

  it('condenses and truncates a large fractional cost (OQ-7 batching data is often fractional)', () => {
    // Isolate Damage so its own (fractional) batch cost leads the list --
    // 2,499,617.5557601233 truncates to 2.49M, not the 2.50M a round would
    // give.
    const levels = {}
    for (const category of WORKSHOP_CATEGORIES) {
      for (const upgrade of category.upgrades) {
        levels[upgrade.name] = upgrade.quantity
      }
    }
    delete levels.Damage
    window.localStorage.setItem('workshopLevels', JSON.stringify(levels))
    render(<UpgradePath />)

    const rows = screen.getAllByRole('listitem')
    expect(rows[0]).toHaveTextContent('Damage')
    expect(rows[0]).toHaveTextContent('2.49M coins')
  })

  describe('Workshop discount Labs (OQ-4)', () => {
    it("shows a discounted cost for a Workshop row, using that tree's own discount Lab level", async () => {
      // Multishot Targets (Attack) costs 450 at level 0 undiscounted --
      // Attack discount Lab level 10 is 5% off (450 x 0.95 = 427.5).
      window.localStorage.setItem('workshopDiscountLabs', JSON.stringify({ attack: 10 }))
      const user = userEvent.setup()
      render(<UpgradePath />)

      const rows = screen.getAllByRole('listitem')
      expect(rows[0]).toHaveTextContent('Multishot Targets')
      expect(rows[0]).toHaveTextContent('427.5 coins')

      await user.click(
        within(rows[0]).getByRole('button', {
          name: 'Buy 1 level of Multishot Targets for 427.5 coins',
        }),
      )

      expect(
        JSON.parse(window.localStorage.getItem('workshopLevels'))['Multishot Targets'],
      ).toBe(1)
    })

    it("doesn't discount an Enhancement row, even when that tree's Workshop discount is maxed", () => {
      // Every Workshop upgrade maxed, every Enhancement maxed except one, so
      // that lone Enhancement is unambiguously the only, first row -- same
      // isolation as the OQ-29 tests below.
      const enhancementLevels = maxedEnhancementLevels()
      delete enhancementLevels['Recovery Package']
      window.localStorage.setItem('workshopLevels', JSON.stringify(maxedWorkshopLevels()))
      window.localStorage.setItem('enhancementLevels', JSON.stringify(enhancementLevels))
      window.localStorage.setItem('enhancementLabLevel', JSON.stringify(1))
      // "Recovery Package" is Utility -- a maxed Utility discount would
      // wrongly discount it if the Workshop/Enhancement boundary leaked.
      window.localStorage.setItem('workshopDiscountLabs', JSON.stringify({ utility: 99 }))
      render(<UpgradePath />)

      const rows = screen.getAllByRole('listitem')
      expect(rows[0]).toHaveTextContent('Recovery Package +')
      expect(rows[0]).toHaveTextContent('5B coins')
    })
  })

  describe('Workshop Enhancements in the path (OQ-29)', () => {
    it('shows an Enhancement row as "{name} +" (the game\'s own convention), and buying it updates enhancementLevels (not workshopLevels)', async () => {
      // Every Workshop upgrade maxed, every Enhancement maxed except one,
      // so that lone Enhancement is unambiguously the only, first row.
      const enhancementLevels = maxedEnhancementLevels()
      delete enhancementLevels['Recovery Package']
      window.localStorage.setItem('workshopLevels', JSON.stringify(maxedWorkshopLevels()))
      window.localStorage.setItem('enhancementLevels', JSON.stringify(enhancementLevels))
      window.localStorage.setItem('enhancementLabLevel', JSON.stringify(1))
      const user = userEvent.setup()
      render(<UpgradePath />)

      const rows = screen.getAllByRole('listitem')
      expect(rows[0]).toHaveTextContent('Recovery Package +')
      expect(rows[0]).toHaveTextContent('5B coins')
      expect(rows[0]).toHaveTextContent('Lv 0 → 1')

      await user.click(
        within(rows[0]).getByRole('button', {
          name: 'Buy 1 level of Recovery Package + for 5B coins',
        }),
      )

      expect(
        JSON.parse(window.localStorage.getItem('enhancementLevels'))['Recovery Package'],
      ).toBe(1)
      expect(
        JSON.parse(window.localStorage.getItem('workshopLevels'))['Recovery Package'],
      ).toBeUndefined()
    })

    it("doesn't mislabel a Workshop row even when an Enhancement shares its name", () => {
      // Isolate the Workshop "Damage" upgrade (an Enhancement category is
      // also named "Damage") -- its row must show plain "Damage", not
      // "Damage +", since it's the game-mirroring Workshop entry, not the
      // Enhancement one.
      const workshopLevels = maxedWorkshopLevels()
      delete workshopLevels.Damage
      window.localStorage.setItem('workshopLevels', JSON.stringify(workshopLevels))
      window.localStorage.setItem('enhancementLevels', JSON.stringify(maxedEnhancementLevels()))
      window.localStorage.setItem('enhancementLabLevel', JSON.stringify(1))
      render(<UpgradePath />)

      const rows = screen.getAllByRole('listitem')
      // Exact match: this fails if the name were actually rendered as
      // "Damage +" instead of plain "Damage".
      expect(within(rows[0]).getByText('Damage', { exact: true })).toBeInTheDocument()
    })
  })

  describe('Workshop Enhancements Lab gate (OQ-31)', () => {
    it('shows the Lab as the only remaining row while locked, and buying it unlocks Enhancements', async () => {
      // Workshop maxed out so the Lab (locked default) is the only thing
      // left to show at all -- Enhancement levels entered here would be
      // ignored anyway while locked, so this also implicitly covers that.
      window.localStorage.setItem('workshopLevels', JSON.stringify(maxedWorkshopLevels()))
      const user = userEvent.setup()
      render(<UpgradePath />)

      const rows = screen.getAllByRole('listitem')
      expect(rows).toHaveLength(1)
      expect(rows[0]).toHaveTextContent('Workshop Enhancements Lab')
      expect(rows[0]).toHaveTextContent('5B coins')
      expect(rows[0]).toHaveTextContent('Lv 0 → 1')
      // Gets its own highlight color, the same way Attack/Defense/Utility
      // rows already do -- see UpgradePath.css's --tree-lab.
      expect(rows[0]).toHaveClass('upgrade-path__row--lab')

      await user.click(
        within(rows[0]).getByRole('button', {
          name: 'Buy 1 level of Workshop Enhancements Lab for 5B coins',
        }),
      )

      expect(JSON.parse(window.localStorage.getItem('enhancementLabLevel'))).toBe(1)

      // Once unlocked, the Lab is gone and real Enhancement categories
      // (shown as "{name} +") take its place.
      const rowsAfter = screen.getAllByRole('listitem')
      expect(screen.queryByText('Workshop Enhancements Lab')).not.toBeInTheDocument()
      expect(rowsAfter[0]).toHaveTextContent('+')
    })

    it('ignores entered Enhancement levels while the Lab is still locked', () => {
      window.localStorage.setItem('workshopLevels', JSON.stringify(maxedWorkshopLevels()))
      window.localStorage.setItem('enhancementLevels', JSON.stringify({ Damage: 5 }))
      render(<UpgradePath />)

      const rows = screen.getAllByRole('listitem')
      expect(rows).toHaveLength(1)
      expect(rows[0]).toHaveTextContent('Workshop Enhancements Lab')
    })
  })

  describe('buying a later occurrence of a repeated upgrade (OQ-19 + confirmation)', () => {
    // Multishot Targets naturally appears twice in the default top rows
    // (Lv 0->1 then Lv 1->2) -- buying the 2nd occurrence without also
    // buying the 1st would silently under-buy, so it should ask first.
    it('buys immediately with no confirmation for the first occurrence', async () => {
      const user = userEvent.setup()
      render(<UpgradePath />)

      const firstRow = screen.getAllByText('Multishot Targets')[0].closest('li')
      await user.click(within(firstRow).getByRole('button', { name: /^Buy/ }))

      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
      expect(
        JSON.parse(window.localStorage.getItem('workshopLevels'))['Multishot Targets'],
      ).toBe(1)
    })

    it('asks for confirmation before buying a later occurrence', async () => {
      const user = userEvent.setup()
      render(<UpgradePath />)

      const secondRow = screen.getAllByText('Multishot Targets')[1].closest('li')
      await user.click(within(secondRow).getByRole('button', { name: /^Buy/ }))

      const dialog = screen.getByRole('alertdialog')
      expect(dialog).toHaveTextContent(
        'Buy all Multishot Targets upgrades to reach Lv 2 (2.45k coins)?',
      )
      expect(JSON.parse(window.localStorage.getItem('workshopLevels'))).toEqual({})
    })

    it('buys every occurrence up to and including this row when "Buy all" is chosen', async () => {
      const user = userEvent.setup()
      render(<UpgradePath />)

      const secondRow = screen.getAllByText('Multishot Targets')[1].closest('li')
      await user.click(within(secondRow).getByRole('button', { name: /^Buy/ }))
      await user.click(screen.getByRole('button', { name: 'Buy all' }))

      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
      expect(
        JSON.parse(window.localStorage.getItem('workshopLevels'))['Multishot Targets'],
      ).toBe(2)
    })

    it('does nothing when the confirmation is cancelled', async () => {
      const user = userEvent.setup()
      render(<UpgradePath />)

      const secondRow = screen.getAllByText('Multishot Targets')[1].closest('li')
      await user.click(within(secondRow).getByRole('button', { name: /^Buy/ }))
      await user.click(screen.getByRole('button', { name: 'Cancel' }))

      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
      expect(JSON.parse(window.localStorage.getItem('workshopLevels'))).toEqual({})
    })
  })

  describe('priority-weighted ranking (OQ-2)', () => {
    it('recommends Cash Bonus + over a Workshop upgrade that would win on raw cost alone', () => {
      // Damage's next batch at level 450 costs ~503M -- far cheaper in raw
      // coins than Cash Bonus's own next level (5B), so cost-only ranking
      // (getCheapestNextUpgrades) would pick this Workshop row first (see
      // this same fixture verified against both ranking functions in
      // getPrioritizedNextUpgrades.test.js). But Cash Bonus is the critical
      // path toward Coin Bonus here (Lab already bought, fresh Enhancement
      // state): the effective cost of finishing that chain is ~60.54B, and
      // 503M already exceeds FALLBACK_RATIO of that (~473M) -- so the
      // priority-weighted ranking actually wired into this screen should
      // recommend completing the Coin Bonus chain instead. This is the
      // component-level proof that UpgradePath is really using
      // getPrioritizedNextUpgrades, not just a fixture that happens to
      // produce the same answer either way (every other test in this file
      // does, which is exactly how two real ranking bugs went unnoticed
      // here -- see Open-Questions.md's OQ-2 history).
      const workshopLevels = maxedWorkshopLevels()
      workshopLevels.Damage = 450
      window.localStorage.setItem('workshopLevels', JSON.stringify(workshopLevels))
      window.localStorage.setItem('enhancementLabLevel', JSON.stringify(1))

      render(<UpgradePath />)

      const rows = screen.getAllByRole('listitem')
      expect(rows[0]).toHaveTextContent('Cash Bonus +')
      expect(rows[0]).toHaveTextContent('5B coins')
      expect(rows[0]).toHaveTextContent('Lv 0 → 1')
    })
  })

  describe('Workshop upgrade-unlock groups (OQ-5)', () => {
    beforeEach(() => {
      // Overrides the outer beforeEach's default-unlocked seed.
      window.localStorage.removeItem('workshopUnlockedGroups')
    })

    it("shows a locked group's own unlock cost as a row, and buying it marks the group purchased", async () => {
      // Everything else maxed and pre-unlocked except Attack's "Multishot
      // Upgrades" group, so its own unlock cost is unambiguously the only
      // row.
      const workshopLevels = maxedWorkshopLevels()
      delete workshopLevels['Multishot Targets']
      delete workshopLevels['Multishot Chance']
      const unlockedGroups = allUnlockedGroups()
      delete unlockedGroups[unlockGroupKey('attack', 'Multishot Upgrades')]
      window.localStorage.setItem('workshopLevels', JSON.stringify(workshopLevels))
      window.localStorage.setItem('workshopUnlockedGroups', JSON.stringify(unlockedGroups))
      // Also unlocked and maxed out, so neither the Lab (otherwise always
      // present while locked) nor any Enhancement category adds an extra
      // row here.
      window.localStorage.setItem('enhancementLabLevel', JSON.stringify(1))
      window.localStorage.setItem('enhancementLevels', JSON.stringify(maxedEnhancementLevels()))
      const user = userEvent.setup()
      render(<UpgradePath />)

      const rows = screen.getAllByRole('listitem')
      expect(rows).toHaveLength(1)
      expect(rows[0]).toHaveTextContent('Unlock: Multishot Upgrades')
      expect(rows[0]).toHaveTextContent('400 coins')

      await user.click(
        within(rows[0]).getByRole('button', {
          name: 'Buy 1 level of Unlock: Multishot Upgrades for 400 coins',
        }),
      )

      expect(
        JSON.parse(window.localStorage.getItem('workshopUnlockedGroups'))[
          unlockGroupKey('attack', 'Multishot Upgrades')
        ],
      ).toBe(true)

      // Once purchased, the group's own upgrades take its place.
      const rowsAfter = screen.getAllByRole('listitem')
      expect(screen.queryByText('Unlock: Multishot Upgrades')).not.toBeInTheDocument()
      expect(rowsAfter.some((row) => row.textContent.includes('Multishot'))).toBe(true)
    })
  })
})
