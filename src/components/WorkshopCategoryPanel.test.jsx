import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
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
})
