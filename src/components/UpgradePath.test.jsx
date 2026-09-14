import { render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { UpgradePath } from './UpgradePath'

describe('UpgradePath', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('shows the cheapest not-yet-maxed upgrade first, with its cost and level jump', () => {
    render(<UpgradePath />)

    const rows = screen.getAllByRole('listitem')
    expect(rows[0]).toHaveTextContent('Attack Speed')
    expect(rows[0]).toHaveTextContent('30 coins')
    expect(rows[0]).toHaveTextContent('Lv 0 → 1')
  })

  it('reflects a level entered on the Workshop screen when ranking', () => {
    window.localStorage.setItem('workshopLevels', JSON.stringify({ Damage: 5 }))
    render(<UpgradePath />)

    const damageRow = screen.getByText('Damage').closest('li')
    expect(damageRow).toHaveTextContent('Lv 5 → 6')
  })

  it('lists an upgrade with unavailable cost data separately, not in the ranked list', () => {
    window.localStorage.setItem('workshopLevels', JSON.stringify({ Health: 5000 }))
    render(<UpgradePath />)

    const list = screen.getByRole('list', { name: 'Cheapest next upgrades' })
    expect(within(list).queryByText('Health')).not.toBeInTheDocument()
    expect(screen.getByText(/Cost data unavailable/)).toBeInTheDocument()
    expect(screen.getByText('Health (Lv 5000)')).toBeInTheDocument()
  })
})
