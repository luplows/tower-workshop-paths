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

    expect(screen.getAllByText('1.00×')).toHaveLength(6)

    const damageInput = screen.getByLabelText('Damage +')
    await user.clear(damageInput)
    await user.type(damageInput, '40')

    expect(screen.getByText('1.40×')).toBeInTheDocument()
    expect(screen.getAllByText('1.00×')).toHaveLength(5)
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
})
