import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { WorkshopCategoryPanel } from './WorkshopCategoryPanel'

const CATEGORY = {
  id: 'attack',
  label: 'Attack',
  upgrades: [{ name: 'Damage', quantity: 6000 }],
}

describe('WorkshopCategoryPanel', () => {
  it('gives the panel a per-tree class, matching the tab bar\'s tree coloring', () => {
    render(
      <WorkshopCategoryPanel category={CATEGORY} levels={{}} onLevelChange={() => {}} />,
    )

    expect(screen.getByRole('tabpanel')).toHaveClass('category-panel--attack')
  })
})
