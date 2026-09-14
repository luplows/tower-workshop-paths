import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { ENHANCEMENT_CATEGORIES } from '../data/enhancementCategories'
import { WORKSHOP_CATEGORIES } from '../data/workshopCategories'
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

describe('UpgradePath', () => {
  beforeEach(() => {
    window.localStorage.clear()
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

    const list = screen.getByRole('list', { name: 'Cheapest next upgrades' })
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

  describe('Workshop Enhancements in the path (OQ-29)', () => {
    it('shows an Enhancement row tagged "Enh", and buying it updates enhancementLevels (not workshopLevels)', async () => {
      // Every Workshop upgrade maxed, every Enhancement maxed except one,
      // so that lone Enhancement is unambiguously the only, first row.
      const enhancementLevels = maxedEnhancementLevels()
      delete enhancementLevels['Recovery Package']
      window.localStorage.setItem('workshopLevels', JSON.stringify(maxedWorkshopLevels()))
      window.localStorage.setItem('enhancementLevels', JSON.stringify(enhancementLevels))
      const user = userEvent.setup()
      render(<UpgradePath />)

      const rows = screen.getAllByRole('listitem')
      expect(rows[0]).toHaveTextContent('Recovery Package')
      expect(rows[0]).toHaveTextContent('Enh')
      expect(rows[0]).toHaveTextContent('5B coins')
      expect(rows[0]).toHaveTextContent('Lv 0 → 1')

      await user.click(
        within(rows[0]).getByRole('button', {
          name: 'Buy 1 level of Recovery Package (Enhancement) for 5B coins',
        }),
      )

      expect(
        JSON.parse(window.localStorage.getItem('enhancementLevels'))['Recovery Package'],
      ).toBe(1)
      expect(
        JSON.parse(window.localStorage.getItem('workshopLevels'))['Recovery Package'],
      ).toBeUndefined()
    })

    it("doesn't tag or mislabel a Workshop row even when an Enhancement shares its name", () => {
      // Isolate the Workshop "Damage" upgrade (an Enhancement category is
      // also named "Damage") -- its row must stay untagged, since it's the
      // game-mirroring Workshop entry, not the Enhancement one.
      const workshopLevels = maxedWorkshopLevels()
      delete workshopLevels.Damage
      window.localStorage.setItem('workshopLevels', JSON.stringify(workshopLevels))
      window.localStorage.setItem('enhancementLevels', JSON.stringify(maxedEnhancementLevels()))
      render(<UpgradePath />)

      const rows = screen.getAllByRole('listitem')
      expect(rows[0]).toHaveTextContent('Damage')
      expect(within(rows[0]).queryByText('Enh')).not.toBeInTheDocument()
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
})
