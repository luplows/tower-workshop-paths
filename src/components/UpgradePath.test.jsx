import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { UpgradePath } from './UpgradePath'

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
        name: 'Buy 1 level of Multishot Targets',
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
      within(row).getByRole('button', { name: 'Buy 10 levels of Attack Speed' }),
    )

    expect(
      JSON.parse(window.localStorage.getItem('workshopLevels'))['Attack Speed'],
    ).toBe(11)
  })
})
