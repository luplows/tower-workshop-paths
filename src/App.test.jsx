import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('defaults to the Upgrade mode, showing Workshop upgrade categories', () => {
    render(<App />)

    expect(screen.getByRole('tab', { name: 'Upgrade' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(screen.getByRole('tab', { name: 'Attack Upgrades' })).toBeInTheDocument()
  })

  it('switches to the Enhance mode, showing Enhancement categories instead', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('tab', { name: 'Enhance' }))

    expect(screen.getByRole('tab', { name: 'Attack Enhancements' })).toBeInTheDocument()
    expect(screen.queryByRole('tab', { name: 'Attack Upgrades' })).not.toBeInTheDocument()
  })

  it('keeps Upgrade and Enhance level entries independent when switching modes', async () => {
    const user = userEvent.setup()
    render(<App />)

    const upgradeDamageInput = screen.getByLabelText('Damage')
    await user.clear(upgradeDamageInput)
    await user.type(upgradeDamageInput, '10')

    await user.click(screen.getByRole('tab', { name: 'Enhance' }))
    const enhanceDamageInput = screen.getByLabelText('Damage')
    await user.clear(enhanceDamageInput)
    await user.type(enhanceDamageInput, '3')

    await user.click(screen.getByRole('tab', { name: 'Upgrade' }))
    expect(screen.getByLabelText('Damage')).toHaveValue(10)

    await user.click(screen.getByRole('tab', { name: 'Enhance' }))
    expect(screen.getByLabelText('Damage')).toHaveValue(3)
  })

  it('persists the selected mode across remount', async () => {
    const user = userEvent.setup()
    const { unmount } = render(<App />)

    await user.click(screen.getByRole('tab', { name: 'Enhance' }))
    unmount()

    render(<App />)
    expect(screen.getByRole('tab', { name: 'Enhance' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
  })
})
