import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { beforeEach, describe, expect, it } from 'vitest'
import { WorkshopInputs } from './WorkshopInputs'

// WorkshopInputs' active category tab is now a controlled prop, owned by
// App (see Open-Questions.md's OQ-16) -- this wrapper stands in for that,
// the same way App does, so these tests can exercise tab switching.
function ControlledWorkshopInputs() {
  const [activeCategoryId, setActiveCategoryId] = useState('attack')
  return (
    <WorkshopInputs
      activeCategoryId={activeCategoryId}
      onCategoryChange={setActiveCategoryId}
    />
  )
}

describe('WorkshopInputs', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('shows the Attack tab by default', () => {
    render(<ControlledWorkshopInputs />)
    expect(screen.getByLabelText('Damage')).toBeInTheDocument()
    expect(screen.queryByLabelText('Health')).not.toBeInTheDocument()
  })

  it('switches to another category tab on click', async () => {
    const user = userEvent.setup()
    render(<ControlledWorkshopInputs />)

    await user.click(screen.getByRole('tab', { name: 'Defense' }))

    expect(screen.getByLabelText('Health')).toBeInTheDocument()
    expect(screen.queryByLabelText('Damage')).not.toBeInTheDocument()
  })

  it('persists an entered level to localStorage and restores it after remount', async () => {
    const user = userEvent.setup()
    const { unmount } = render(<ControlledWorkshopInputs />)

    const damageInput = screen.getByLabelText('Damage')
    await user.clear(damageInput)
    await user.type(damageInput, '250')

    expect(JSON.parse(window.localStorage.getItem('workshopLevels'))).toEqual({
      Damage: 250,
    })

    unmount()
    render(<ControlledWorkshopInputs />)
    expect(screen.getByLabelText('Damage')).toHaveValue(250)
  })

  it('keeps a level entered on one tab after switching away and back', async () => {
    const user = userEvent.setup()
    render(<ControlledWorkshopInputs />)

    const damageInput = screen.getByLabelText('Damage')
    await user.clear(damageInput)
    await user.type(damageInput, '42')

    await user.click(screen.getByRole('tab', { name: 'Defense' }))
    await user.click(screen.getByRole('tab', { name: 'Attack' }))

    expect(screen.getByLabelText('Damage')).toHaveValue(42)
  })
})
