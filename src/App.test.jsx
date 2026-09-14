import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import App from './App'
import { WORKSHOP_UNLOCK_GROUPS } from './data/workshopUnlockGroups'
import { unlockGroupKey } from './utils/workshopUnlockGroups'

const allUnlockedGroups = () => {
  const unlocked = {}
  for (const [categoryId, groups] of Object.entries(WORKSHOP_UNLOCK_GROUPS)) {
    for (const group of groups) unlocked[unlockGroupKey(categoryId, group.name)] = true
  }
  return unlocked
}

describe('App', () => {
  beforeEach(() => {
    window.localStorage.clear()
    delete document.documentElement.dataset.theme
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
    window.localStorage.setItem('enhancementLabLevel', JSON.stringify(1))
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('tab', { name: 'Enhance' }))

    expect(screen.getByRole('tab', { name: 'Attack' })).toBeInTheDocument()
    expect(screen.getAllByText('1.00×').length).toBeGreaterThan(0)
  })

  it('keeps Upgrade and Enhance level entries independent when switching modes', async () => {
    window.localStorage.setItem('enhancementLabLevel', JSON.stringify(1))
    const user = userEvent.setup()
    render(<App />)

    const upgradeDamageInput = screen.getByLabelText('Damage')
    await user.clear(upgradeDamageInput)
    await user.type(upgradeDamageInput, '10')

    await user.click(screen.getByRole('tab', { name: 'Enhance' }))
    const enhanceDamageInput = screen.getByLabelText('Damage +')
    await user.clear(enhanceDamageInput)
    await user.type(enhanceDamageInput, '3')

    await user.click(screen.getByRole('tab', { name: 'Upgrade' }))
    expect(screen.getByLabelText('Damage')).toHaveValue(10)

    await user.click(screen.getByRole('tab', { name: 'Enhance' }))
    expect(screen.getByLabelText('Damage +')).toHaveValue(3)
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
    window.localStorage.setItem('enhancementLabLevel', JSON.stringify(1))
    // "Cash Bonus" belongs to Utility's paid "Cash Bonuses" unlock group
    // (OQ-5), not its free starter -- unlock it so the input is reachable.
    window.localStorage.setItem(
      'workshopUnlockedGroups',
      JSON.stringify({ [unlockGroupKey('utility', 'Cash Bonuses')]: true }),
    )
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('tab', { name: 'Utility' }))
    expect(screen.getByLabelText('Cash Bonus')).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: 'Enhance' }))
    expect(screen.getByRole('tab', { name: 'Utility' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(screen.getByLabelText('Cash Bonus +')).toBeInTheDocument()

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
    // Every unlock group already purchased (OQ-5) -- this test is about
    // Path ranking/navigation itself, not the unlock gate.
    window.localStorage.setItem('workshopUnlockedGroups', JSON.stringify(allUnlockedGroups()))
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('tab', { name: 'Path' }))

    expect(screen.getAllByRole('listitem')[0]).toHaveTextContent('Multishot Targets')
    expect(screen.queryByRole('tab', { name: 'Attack' })).not.toBeInTheDocument()
  })

  it('reflects a level entered on the Upgrade screen in the Path ranking (OQ-17)', async () => {
    const user = userEvent.setup()
    render(<App />)

    const attackSpeedInput = screen.getByLabelText('Attack Speed')
    await user.clear(attackSpeedInput)
    await user.type(attackSpeedInput, '1')

    await user.click(screen.getByRole('tab', { name: 'Path' }))

    // Attack Speed can legitimately appear more than once (OQ-19) -- its
    // first, cheapest occurrence should start from the entered level,
    // batched 10 levels at a time since its max level is under 1000 (OQ-7).
    expect(screen.getAllByText('Attack Speed')[0].closest('li')).toHaveTextContent('Lv 1 → 11')
  })

  it('clears both Upgrade and Enhance levels after confirming, and leaves them if cancelled (OQ-22)', async () => {
    window.localStorage.setItem('enhancementLabLevel', JSON.stringify(1))
    const user = userEvent.setup()
    render(<App />)

    const upgradeDamageInput = screen.getByLabelText('Damage')
    await user.clear(upgradeDamageInput)
    await user.type(upgradeDamageInput, '10')

    await user.click(screen.getByRole('tab', { name: 'Enhance' }))
    const enhanceDamageInput = screen.getByLabelText('Damage +')
    await user.clear(enhanceDamageInput)
    await user.type(enhanceDamageInput, '3')

    // Cancelling the confirmation leaves both levels untouched.
    await user.click(screen.getByRole('button', { name: 'More actions' }))
    await user.click(screen.getByText('Clear all levels'))
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.getByLabelText('Damage +')).toHaveValue(3)

    await user.click(screen.getByRole('button', { name: 'More actions' }))
    await user.click(screen.getByText('Clear all levels'))
    await user.click(screen.getByRole('button', { name: 'Clear' }))
    // The Lab is re-locked too (OQ-32), so the Enhance screen now shows its
    // lock prompt in place of a zeroed-out input.
    expect(screen.getByText('Workshop Enhancements are locked')).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: 'Upgrade' }))
    expect(screen.getByLabelText('Damage')).toHaveValue(0)
  })

  it('also re-locks the Workshop Enhancements Lab when clearing (OQ-31)', async () => {
    window.localStorage.setItem('enhancementLabLevel', JSON.stringify(1))
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'More actions' }))
    await user.click(screen.getByText('Clear all levels'))
    await user.click(screen.getByRole('button', { name: 'Clear' }))

    expect(window.localStorage.getItem('enhancementLabLevel')).toBeNull()
  })

  it('unlocking on the Enhance screen also removes the Lab from the Path list (OQ-32)', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('tab', { name: 'Enhance' }))
    expect(screen.getByText('Workshop Enhancements are locked')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Unlock (5B coins)' }))
    expect(screen.getByLabelText('Damage +')).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: 'Path' }))
    expect(screen.queryByText('Workshop Enhancements Lab')).not.toBeInTheDocument()
  })

  describe('theme toggle', () => {
    it('defaults to Auto, leaving <html> without a data-theme override', () => {
      render(<App />)

      expect(document.documentElement.dataset.theme).toBeUndefined()
    })

    it('sets data-theme on <html> (not the #root div) when Light or Dark is chosen', async () => {
      const user = userEvent.setup()
      render(<App />)

      await user.click(screen.getByRole('button', { name: 'More actions' }))
      await user.click(screen.getByRole('radio', { name: 'Dark' }))

      expect(document.documentElement.dataset.theme).toBe('dark')

      await user.click(screen.getByRole('radio', { name: 'Light' }))
      expect(document.documentElement.dataset.theme).toBe('light')
    })

    it('clears data-theme when switching back to Auto', async () => {
      const user = userEvent.setup()
      render(<App />)

      await user.click(screen.getByRole('button', { name: 'More actions' }))
      await user.click(screen.getByRole('radio', { name: 'Dark' }))
      expect(document.documentElement.dataset.theme).toBe('dark')

      await user.click(screen.getByRole('radio', { name: 'Auto' }))
      expect(document.documentElement.dataset.theme).toBeUndefined()
    })

    it('persists the chosen theme under its own localStorage key, across remount', async () => {
      const user = userEvent.setup()
      const { unmount } = render(<App />)

      await user.click(screen.getByRole('button', { name: 'More actions' }))
      await user.click(screen.getByRole('radio', { name: 'Dark' }))
      expect(JSON.parse(window.localStorage.getItem('themePreference'))).toBe('dark')

      unmount()
      render(<App />)
      expect(document.documentElement.dataset.theme).toBe('dark')
    })

    it("isn't reset by Clear all levels -- it's a display preference, not entered game data", async () => {
      const user = userEvent.setup()
      render(<App />)

      await user.click(screen.getByRole('button', { name: 'More actions' }))
      await user.click(screen.getByRole('radio', { name: 'Dark' }))
      // The menu stays open after picking a theme (see HeaderMenu) -- no
      // need to reopen it before clicking Clear all levels.
      await user.click(screen.getByText('Clear all levels'))
      await user.click(screen.getByRole('button', { name: 'Clear' }))

      expect(document.documentElement.dataset.theme).toBe('dark')
    })
  })
})
