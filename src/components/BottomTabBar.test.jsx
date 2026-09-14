import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { BottomTabBar } from './BottomTabBar'

const CATEGORIES = [
  { id: 'attack', label: 'Attack' },
  { id: 'defense', label: 'Defense' },
  { id: 'utility', label: 'Utility' },
]

describe('BottomTabBar', () => {
  it('renders a tab per category, matching the in-game tab names', () => {
    render(
      <BottomTabBar categories={CATEGORIES} activeCategoryId="attack" onSelect={() => {}} />,
    )

    expect(screen.getByRole('tab', { name: 'Attack' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(screen.getByRole('tab', { name: 'Defense' })).toHaveAttribute(
      'aria-selected',
      'false',
    )
  })

  it('reports the clicked category id', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(
      <BottomTabBar categories={CATEGORIES} activeCategoryId="attack" onSelect={onSelect} />,
    )

    await user.click(screen.getByRole('tab', { name: 'Utility' }))

    expect(onSelect).toHaveBeenCalledWith('utility')
  })

  it('gives each tab a per-tree class, for OQ-11\'s in-game tree coloring', () => {
    render(
      <BottomTabBar categories={CATEGORIES} activeCategoryId="attack" onSelect={() => {}} />,
    )

    expect(screen.getByRole('tab', { name: 'Attack' })).toHaveClass(
      'bottom-tab-bar__tab--attack',
    )
    expect(screen.getByRole('tab', { name: 'Defense' })).toHaveClass(
      'bottom-tab-bar__tab--defense',
    )
    expect(screen.getByRole('tab', { name: 'Utility' })).toHaveClass(
      'bottom-tab-bar__tab--utility',
    )
  })
})
