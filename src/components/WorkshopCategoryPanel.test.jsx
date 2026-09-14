import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { unlockGroupKey } from '../utils/workshopUnlockGroups'
import { WorkshopCategoryPanel } from './WorkshopCategoryPanel'

const categoryWith = (id) => ({
  id,
  label: id,
  upgrades: [{ name: 'Damage', quantity: 6000 }],
})

describe('WorkshopCategoryPanel', () => {
  it.each(['attack', 'defense', 'utility'])(
    'gives the %s panel its own tree class, matching the tab bar\'s tree coloring',
    (id) => {
      render(
        <WorkshopCategoryPanel
          category={categoryWith(id)}
          levels={{}}
          onLevelChange={() => {}}
        />,
      )

      expect(screen.getByRole('tabpanel')).toHaveClass(`category-panel--${id}`)
    },
  )

  describe('per-tree cumulative-spend gate (OQ-6)', () => {
    // "Damage"/"Rend Armor" is real Enhancement data (see
    // enhancementLevels.js) -- a plain fixture name wouldn't have real cost
    // data for enhancementTreeSpend to sum, since only Enhancement
    // categories are gated this way in the first place (a plain Workshop
    // upgrade never sets `unlocksAt`).
    const attackTree = {
      id: 'attack',
      label: 'Attack',
      upgrades: [
        { name: 'Damage', unlocksAt: null, quantity: 600 },
        { name: 'Rend Armor', unlocksAt: 50e9, quantity: 600 },
      ],
    }

    it('shows a locked note instead of the normal input for a not-yet-reachable category', () => {
      render(<WorkshopCategoryPanel category={attackTree} levels={{}} onLevelChange={() => {}} />)

      expect(screen.queryByLabelText('Rend Armor')).not.toBeInTheDocument()
      expect(screen.getByText('Rend Armor')).toBeInTheDocument()
      expect(screen.getByText(/Locked until 50B coins spent in this tree/)).toBeInTheDocument()
    })

    it("shows the normal input once the tree's cumulative spend crosses the threshold", () => {
      render(
        <WorkshopCategoryPanel
          category={attackTree}
          levels={{ Damage: 10 }}
          onLevelChange={() => {}}
        />,
      )

      expect(screen.getByLabelText('Rend Armor')).toBeInTheDocument()
      expect(screen.queryByText(/Locked/)).not.toBeInTheDocument()
    })

    it('never locks a category with no unlocksAt threshold (every plain Workshop upgrade)', () => {
      render(
        <WorkshopCategoryPanel
          category={categoryWith('attack')}
          levels={{}}
          onLevelChange={() => {}}
        />,
      )

      expect(screen.getByLabelText('Damage')).toBeInTheDocument()
    })
  })

  describe('Workshop upgrade-unlock groups (OQ-5)', () => {
    // Real Workshop upgrade names/groups (see workshopUnlockGroups.js) --
    // Damage is in Attack's free "Default" group, Range is in the paid
    // "Range Upgrades" group (50 coins).
    const attackWorkshopTree = {
      id: 'attack',
      label: 'Attack',
      upgrades: [
        { name: 'Damage', quantity: 6000 },
        { name: 'Range', quantity: 99 },
      ],
    }

    it('shows the normal input when onUnlockGroup is not passed at all (the Enhance screen has no unlock groups)', () => {
      render(
        <WorkshopCategoryPanel category={attackWorkshopTree} levels={{}} onLevelChange={() => {}} />,
      )

      expect(screen.getByLabelText('Range')).toBeInTheDocument()
    })

    it("shows an inline Unlock button instead of the input for a locked group's upgrade", () => {
      render(
        <WorkshopCategoryPanel
          category={attackWorkshopTree}
          levels={{}}
          onLevelChange={() => {}}
          unlockedGroups={{}}
          onUnlockGroup={() => {}}
        />,
      )

      expect(screen.queryByLabelText('Range')).not.toBeInTheDocument()
      expect(screen.getByText('Range')).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: 'Unlock "Range Upgrades" (50 coins)' }),
      ).toBeInTheDocument()
    })

    it('calls onUnlockGroup with the category id and group name when clicked', async () => {
      const user = userEvent.setup()
      const handleUnlock = vi.fn()
      render(
        <WorkshopCategoryPanel
          category={attackWorkshopTree}
          levels={{}}
          onLevelChange={() => {}}
          unlockedGroups={{}}
          onUnlockGroup={handleUnlock}
        />,
      )

      await user.click(screen.getByRole('button', { name: /Unlock/ }))
      expect(handleUnlock).toHaveBeenCalledWith('attack', 'Range Upgrades')
    })

    it('shows the normal input once the group is marked purchased', () => {
      render(
        <WorkshopCategoryPanel
          category={attackWorkshopTree}
          levels={{}}
          onLevelChange={() => {}}
          unlockedGroups={{ [unlockGroupKey('attack', 'Range Upgrades')]: true }}
          onUnlockGroup={() => {}}
        />,
      )

      expect(screen.getByLabelText('Range')).toBeInTheDocument()
    })

    it("never locks Damage, Attack's free Default-group upgrade", () => {
      render(
        <WorkshopCategoryPanel
          category={attackWorkshopTree}
          levels={{}}
          onLevelChange={() => {}}
          unlockedGroups={{}}
          onUnlockGroup={() => {}}
        />,
      )

      expect(screen.getByLabelText('Damage')).toBeInTheDocument()
    })
  })
})
