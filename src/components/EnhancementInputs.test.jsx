import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { EnhancementInputs } from './EnhancementInputs'

describe('EnhancementInputs', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('shows the Attack tree by default', () => {
    render(<EnhancementInputs />)
    expect(screen.getByLabelText('Damage')).toBeInTheDocument()
    expect(screen.queryByLabelText('Health')).not.toBeInTheDocument()
  })

  it('switches to another tree tab on click', async () => {
    const user = userEvent.setup()
    render(<EnhancementInputs />)

    await user.click(screen.getByRole('tab', { name: 'Defense Enhancements' }))

    expect(screen.getByLabelText('Health')).toBeInTheDocument()
    expect(screen.queryByLabelText('Damage')).not.toBeInTheDocument()
  })

  it('persists an entered level under its own storage key, separate from Workshop levels', async () => {
    const user = userEvent.setup()
    const { unmount } = render(<EnhancementInputs />)

    const damageInput = screen.getByLabelText('Damage')
    await user.clear(damageInput)
    await user.type(damageInput, '12')

    expect(JSON.parse(window.localStorage.getItem('enhancementLevels'))).toEqual({
      Damage: 12,
    })
    expect(window.localStorage.getItem('workshopLevels')).toBeNull()

    unmount()
    render(<EnhancementInputs />)
    expect(screen.getByLabelText('Damage')).toHaveValue(12)
  })
})
