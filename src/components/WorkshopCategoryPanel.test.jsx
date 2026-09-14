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
})
