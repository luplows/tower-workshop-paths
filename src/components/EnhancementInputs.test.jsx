import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { beforeEach, describe, expect, it } from 'vitest'
import { EnhancementInputs } from './EnhancementInputs'

// EnhancementInputs' active category tab is now a controlled prop, owned by
// App (see Open-Questions.md's OQ-16) -- this wrapper stands in for that,
// the same way App does, so these tests can exercise tab switching.
function ControlledEnhancementInputs() {
  const [activeCategoryId, setActiveCategoryId] = useState('attack')
  return (
    <EnhancementInputs
      activeCategoryId={activeCategoryId}
      onCategoryChange={setActiveCategoryId}
    />
  )
}

describe('EnhancementInputs', () => {
  beforeEach(() => {
    window.localStorage.clear()
    // Unlocked by default -- most of these tests are about the tree
    // tabs/inputs themselves, not the Lab gate (see its own describe below).
    window.localStorage.setItem('enhancementLabLevel', JSON.stringify(1))
  })

  it('shows the Attack tree by default', () => {
    render(<ControlledEnhancementInputs />)
    expect(screen.getByLabelText('Damage +')).toBeInTheDocument()
    expect(screen.queryByLabelText('Health +')).not.toBeInTheDocument()
  })

  it('switches to another tree tab on click', async () => {
    const user = userEvent.setup()
    render(<ControlledEnhancementInputs />)

    await user.click(screen.getByRole('tab', { name: 'Defense' }))

    expect(screen.getByLabelText('Health +')).toBeInTheDocument()
    expect(screen.queryByLabelText('Damage +')).not.toBeInTheDocument()
  })

  it('shows each name with a trailing "+", the game\'s own naming convention for Enhancements', () => {
    render(<ControlledEnhancementInputs />)
    expect(screen.getByLabelText('Damage +')).toBeInTheDocument()
    // Exact match: would fail if the label were still plain "Damage".
    expect(screen.queryByLabelText('Damage', { exact: true })).not.toBeInTheDocument()
  })

  it('shows the computed value next to the level, since level alone is never visible in-game', async () => {
    const user = userEvent.setup()
    render(<ControlledEnhancementInputs />)

    // Only Damage (Attack's free starter -- see the per-tree gate describe
    // block below) is unlocked from a fresh state, so it's the only value
    // shown at all.
    expect(screen.getAllByText('1.00×')).toHaveLength(1)

    const damageInput = screen.getByLabelText('Damage +')
    await user.clear(damageInput)
    await user.type(damageInput, '5')

    expect(screen.getByText('1.05×')).toBeInTheDocument()
    expect(screen.queryByText('1.00×')).not.toBeInTheDocument()
  })

  it('hard-caps an entered level at the category max', async () => {
    const user = userEvent.setup()
    render(<ControlledEnhancementInputs />)

    const damageInput = screen.getByLabelText('Damage +')
    await user.clear(damageInput)
    await user.type(damageInput, '9999')

    expect(damageInput).toHaveValue(600)
  })

  it('persists an entered level under its own storage key, separate from Workshop levels', async () => {
    const user = userEvent.setup()
    const { unmount } = render(<ControlledEnhancementInputs />)

    const damageInput = screen.getByLabelText('Damage +')
    await user.clear(damageInput)
    await user.type(damageInput, '12')

    expect(JSON.parse(window.localStorage.getItem('enhancementLevels'))).toEqual({
      Damage: 12,
    })
    expect(window.localStorage.getItem('workshopLevels')).toBeNull()

    unmount()
    render(<ControlledEnhancementInputs />)
    expect(screen.getByLabelText('Damage +')).toHaveValue(12)
  })

  describe('per-tree cumulative-spend gate (OQ-6)', () => {
    it('shows only the next category to unlock, with the coins still needed to unlock it', () => {
      render(<ControlledEnhancementInputs />)

      expect(screen.queryByLabelText('Rend Armor +')).not.toBeInTheDocument()
      expect(screen.getByText('Rend Armor +')).toBeInTheDocument()
      expect(
        screen.getByText('50B coins more spent in this tree to unlock'),
      ).toBeInTheDocument()

      // Critical Factor (next after Rend Armor) is fully hidden, not shown
      // with its own redundant locked note.
      expect(screen.queryByLabelText('Critical Factor +')).not.toBeInTheDocument()
      expect(screen.queryByText('Critical Factor +')).not.toBeInTheDocument()
    })

    it("unlocks a category once its tree's cumulative spend crosses the threshold", () => {
      // Damage (Attack's free starter) at level 10 has spent ~55.5B coins,
      // just past Rend Armor's 50B threshold.
      window.localStorage.setItem('enhancementLevels', JSON.stringify({ Damage: 10 }))
      render(<ControlledEnhancementInputs />)

      expect(screen.getByLabelText('Rend Armor +')).toBeInTheDocument()
      expect(screen.queryByText(/more spent in this tree to unlock/)).toBeInTheDocument()
      // Critical Factor is now the next category to unlock, in Rend
      // Armor's place.
      expect(screen.getByText('Critical Factor +')).toBeInTheDocument()
      expect(screen.queryByLabelText('Critical Factor +')).not.toBeInTheDocument()
    })
  })

  describe('while the Workshop Enhancements Lab is locked (OQ-32)', () => {
    beforeEach(() => {
      // Overrides the outer beforeEach's default-unlocked seed.
      window.localStorage.removeItem('enhancementLabLevel')
    })

    it('shows a lock prompt instead of the tree tabs and inputs', () => {
      render(<ControlledEnhancementInputs />)

      expect(
        screen.getByText('Workshop Enhancements are locked'),
      ).toBeInTheDocument()
      expect(screen.queryByRole('tab', { name: 'Attack' })).not.toBeInTheDocument()
      expect(screen.queryByLabelText('Damage +')).not.toBeInTheDocument()
    })

    it('unlocks and shows the normal screen once the unlock button is clicked', async () => {
      const user = userEvent.setup()
      render(<ControlledEnhancementInputs />)

      await user.click(screen.getByRole('button', { name: 'Unlock (5B coins)' }))

      expect(JSON.parse(window.localStorage.getItem('enhancementLabLevel'))).toBe(1)
      expect(screen.getByLabelText('Damage +')).toBeInTheDocument()
      expect(
        screen.queryByText('Workshop Enhancements are locked'),
      ).not.toBeInTheDocument()
    })
  })
})
