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
    // "Damage"/"Rend Armor"/"Critical Factor" is real Enhancement data (see
    // enhancementLevels.js) -- a plain fixture name wouldn't have real cost
    // data for enhancementTreeSpend to sum, since only Enhancement
    // categories are gated this way in the first place (a plain Workshop
    // upgrade never sets `unlocksAt`). Ascending thresholds, matching the
    // real data's own order.
    const attackTree = {
      id: 'attack',
      label: 'Attack',
      upgrades: [
        { name: 'Damage', unlocksAt: null, quantity: 600 },
        { name: 'Rend Armor', unlocksAt: 50e9, quantity: 600 },
        { name: 'Critical Factor', unlocksAt: 500e9, quantity: 600 },
      ],
    }

    it('shows only the next category to unlock, with the coins still needed, and hides every category after it', () => {
      render(<WorkshopCategoryPanel category={attackTree} levels={{}} onLevelChange={() => {}} />)

      expect(screen.queryByLabelText('Rend Armor')).not.toBeInTheDocument()
      expect(screen.getByText('Rend Armor')).toBeInTheDocument()
      expect(
        screen.getByText('50B coins more spent in this tree to unlock'),
      ).toBeInTheDocument()

      // Critical Factor is next in sequence after Rend Armor -- fully
      // hidden, not shown with its own (redundant) locked note.
      expect(screen.queryByLabelText('Critical Factor')).not.toBeInTheDocument()
      expect(screen.queryByText('Critical Factor')).not.toBeInTheDocument()
    })

    it('reduces the coins-needed figure as the tree accumulates spend, without unlocking early', () => {
      // Damage at level 1 has spent 5,000,000,000 (5B) -- 45B still needed
      // for Rend Armor's 50B threshold.
      render(
        <WorkshopCategoryPanel
          category={attackTree}
          levels={{ Damage: 1 }}
          onLevelChange={() => {}}
        />,
      )

      expect(screen.queryByLabelText('Rend Armor')).not.toBeInTheDocument()
      expect(
        screen.getByText('45B coins more spent in this tree to unlock'),
      ).toBeInTheDocument()
    })

    it("shows the normal input once the tree's cumulative spend crosses the threshold, and moves the note to the next category", () => {
      render(
        <WorkshopCategoryPanel
          category={attackTree}
          levels={{ Damage: 10 }}
          onLevelChange={() => {}}
        />,
      )

      expect(screen.getByLabelText('Rend Armor')).toBeInTheDocument()
      expect(screen.queryByText(/more spent in this tree to unlock/)).toBeInTheDocument()
      expect(screen.queryByLabelText('Critical Factor')).not.toBeInTheDocument()
      expect(screen.getByText('Critical Factor')).toBeInTheDocument()
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

    it("hides a locked group's upgrade entirely and shows a single Unlock button below the visible upgrades instead", () => {
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
      expect(screen.queryByText('Range')).not.toBeInTheDocument()
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

    describe('groups unlock in order within a tree', () => {
      // Range is in the 1st paid group ("Range Upgrades", 50 coins),
      // Multishot Chance in the 2nd ("Multishot Upgrades", 400 coins) --
      // Multishot Chance can't be bought before Range Upgrades, even though
      // they gate unrelated upgrades.
      const treeWithTwoPaidGroups = {
        id: 'attack',
        label: 'Attack',
        upgrades: [
          { name: 'Range', quantity: 99 },
          { name: 'Multishot Chance', quantity: 30 },
        ],
      }

      it("hides a later group's upgrade too, showing only the one Unlock button for the group actually next", () => {
        render(
          <WorkshopCategoryPanel
            category={treeWithTwoPaidGroups}
            levels={{}}
            onLevelChange={() => {}}
            unlockedGroups={{}}
            onUnlockGroup={() => {}}
          />,
        )

        expect(
          screen.getByRole('button', { name: 'Unlock "Range Upgrades" (50 coins)' }),
        ).toBeInTheDocument()
        expect(
          screen.queryByRole('button', { name: /Multishot Upgrades/ }),
        ).not.toBeInTheDocument()
        expect(screen.queryByText('Multishot Chance')).not.toBeInTheDocument()
        // Exactly one Unlock button total, not one per hidden upgrade.
        expect(screen.getAllByRole('button', { name: /^Unlock/ })).toHaveLength(1)
      })

      it('shows the Unlock button for the next group only once the earlier one is purchased', () => {
        render(
          <WorkshopCategoryPanel
            category={treeWithTwoPaidGroups}
            levels={{}}
            onLevelChange={() => {}}
            unlockedGroups={{ [unlockGroupKey('attack', 'Range Upgrades')]: true }}
            onUnlockGroup={() => {}}
          />,
        )

        expect(screen.getByLabelText('Range')).toBeInTheDocument()
        expect(
          screen.getByRole('button', { name: 'Unlock "Multishot Upgrades" (400 coins)' }),
        ).toBeInTheDocument()
      })
    })
  })
})
