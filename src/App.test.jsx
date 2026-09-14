import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('shows a title/header identifying the app', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Workshop Input' })).toBeInTheDocument()
  })

  it('keeps the Path section on a separate control from the game-mirroring Upgrade/Enhance toggle', () => {
    render(<App />)

    const pathTab = screen.getByRole('tab', { name: 'Path' })
    const upgradeTab = screen.getByRole('tab', { name: 'Upgrade' })
    const enhanceTab = screen.getByRole('tab', { name: 'Enhance' })

    const pathTablist = pathTab.closest('[role="tablist"]')
    expect(pathTablist).toHaveAttribute('aria-label', 'App section')
    // Path must not share a tablist with Upgrade/Enhance -- that toggle
    // mirrors the game's own buttons, and there's no "Path" in-game.
    expect(upgradeTab.closest('[role="tablist"]')).not.toBe(pathTablist)
    expect(enhanceTab.closest('[role="tablist"]')).not.toBe(pathTablist)
  })

  it('defaults to the Upgrade mode, showing Workshop upgrade categories', () => {
    render(<App />)

    expect(screen.getByRole('tab', { name: 'Upgrade' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(screen.getByRole('tab', { name: 'Attack' })).toBeInTheDocument()
    expect(screen.queryByText('1.00×')).not.toBeInTheDocument()
  })

  it('switches to the Enhance mode, showing Enhancement categories with a computed value', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('tab', { name: 'Enhance' }))

    expect(screen.getByRole('tab', { name: 'Attack' })).toBeInTheDocument()
    expect(screen.getAllByText('1.00×').length).toBeGreaterThan(0)
  })

  it('keeps Upgrade and Enhance level entries independent when switching modes', async () => {
    const user = userEvent.setup()
    render(<App />)

    const upgradeDamageInput = screen.getByLabelText('Damage')
    await user.clear(upgradeDamageInput)
    await user.type(upgradeDamageInput, '10')

    await user.click(screen.getByRole('tab', { name: 'Enhance' }))
    const enhanceDamageInput = screen.getByLabelText('Damage')
    await user.clear(enhanceDamageInput)
    await user.type(enhanceDamageInput, '3')

    await user.click(screen.getByRole('tab', { name: 'Upgrade' }))
    expect(screen.getByLabelText('Damage')).toHaveValue(10)

    await user.click(screen.getByRole('tab', { name: 'Enhance' }))
    expect(screen.getByLabelText('Damage')).toHaveValue(3)
  })

  it('persists the selected mode across remount', async () => {
    const user = userEvent.setup()
    const { unmount } = render(<App />)

    await user.click(screen.getByRole('tab', { name: 'Enhance' }))
    unmount()

    render(<App />)
    expect(screen.getByRole('tab', { name: 'Enhance' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
  })

  it('keeps the same tree tab selected when switching between Upgrade and Enhance (OQ-16)', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('tab', { name: 'Utility' }))
    expect(screen.getByLabelText('Cash Bonus')).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: 'Enhance' }))
    expect(screen.getByRole('tab', { name: 'Utility' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(screen.getByLabelText('Cash Bonus')).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: 'Upgrade' }))
    expect(screen.getByRole('tab', { name: 'Utility' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(screen.getByLabelText('Cash Bonus')).toBeInTheDocument()
  })

  it('persists the selected tree tab across remount (OQ-16)', async () => {
    const user = userEvent.setup()
    const { unmount } = render(<App />)

    await user.click(screen.getByRole('tab', { name: 'Defense' }))
    unmount()

    render(<App />)
    expect(screen.getByRole('tab', { name: 'Defense' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(screen.getByLabelText('Health')).toBeInTheDocument()
  })

  it('switches to the Path mode, showing the cheapest not-yet-maxed upgrade first (OQ-17)', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('tab', { name: 'Path' }))

    expect(screen.getAllByRole('listitem')[0]).toHaveTextContent('Attack Speed')
    expect(screen.queryByRole('tab', { name: 'Attack' })).not.toBeInTheDocument()
  })

  it('reflects a level entered on the Upgrade screen in the Path ranking (OQ-17)', async () => {
    const user = userEvent.setup()
    render(<App />)

    const damageInput = screen.getByLabelText('Damage')
    await user.clear(damageInput)
    await user.type(damageInput, '5')

    await user.click(screen.getByRole('tab', { name: 'Path' }))

    expect(screen.getByText('Damage').closest('li')).toHaveTextContent('Lv 5 → 6')
  })
})
