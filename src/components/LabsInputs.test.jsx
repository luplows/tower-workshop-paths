import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { LabsInputs } from './LabsInputs'

describe('LabsInputs', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('shows all 3 Workshop discount Labs at once, each labeled by its own tree', () => {
    render(<LabsInputs />)

    expect(screen.getByLabelText('Attack Discount Lab')).toHaveValue(0)
    expect(screen.getByLabelText('Defense Discount Lab')).toHaveValue(0)
    expect(screen.getByLabelText('Utility Discount Lab')).toHaveValue(0)
  })

  it('shows the percent off computed from each entered level', () => {
    window.localStorage.setItem('workshopDiscountLabs', JSON.stringify({ attack: 10, utility: 99 }))
    render(<LabsInputs />)

    expect(screen.getByLabelText('Attack Discount Lab')).toHaveValue(10)
    expect(screen.getByText('5.0% off')).toBeInTheDocument()
    expect(screen.getByLabelText('Utility Discount Lab')).toHaveValue(99)
    expect(screen.getByText('49.5% off')).toBeInTheDocument()
    expect(screen.getByLabelText('Defense Discount Lab')).toHaveValue(0)
    expect(screen.getByText('0.0% off')).toBeInTheDocument()
  })

  it('persists an entered level under workshopDiscountLabs, keyed per tree', async () => {
    const user = userEvent.setup()
    const { unmount } = render(<LabsInputs />)

    const attackInput = screen.getByLabelText('Attack Discount Lab')
    await user.clear(attackInput)
    await user.type(attackInput, '20')

    expect(JSON.parse(window.localStorage.getItem('workshopDiscountLabs'))).toEqual({
      attack: 20,
    })

    unmount()
    render(<LabsInputs />)
    expect(screen.getByLabelText('Attack Discount Lab')).toHaveValue(20)
  })

  it('keeps each tree independent -- entering one leaves the others untouched', async () => {
    const user = userEvent.setup()
    render(<LabsInputs />)

    const attackInput = screen.getByLabelText('Attack Discount Lab')
    await user.clear(attackInput)
    await user.type(attackInput, '30')

    expect(screen.getByLabelText('Defense Discount Lab')).toHaveValue(0)
    expect(screen.getByLabelText('Utility Discount Lab')).toHaveValue(0)
    expect(JSON.parse(window.localStorage.getItem('workshopDiscountLabs'))).toEqual({
      attack: 30,
    })
  })

  it("hard-caps an entered level at 99, the discount Lab's own max", () => {
    render(<LabsInputs />)

    fireEvent.change(screen.getByLabelText('Defense Discount Lab'), { target: { value: '999' } })

    expect(screen.getByLabelText('Defense Discount Lab')).toHaveValue(99)
  })

  describe('Workshop Enhancements unlock (OQ-31)', () => {
    it('shows the unlock as a plain 0/1 Lab, matching the discount Labs\' own shape -- Locked at level 0', () => {
      render(<LabsInputs />)

      const unlockInput = screen.getByLabelText('Workshop Enhancements Lab')
      expect(unlockInput).toHaveValue(0)
      expect(unlockInput).toHaveAttribute('max', '1')
      expect(screen.getByText('Locked')).toBeInTheDocument()
    })

    it('reflects an already-unlocked state from localStorage as Unlocked', () => {
      window.localStorage.setItem('enhancementLabLevel', JSON.stringify(1))
      render(<LabsInputs />)

      expect(screen.getByLabelText('Workshop Enhancements Lab')).toHaveValue(1)
      expect(screen.getByText('Unlocked')).toBeInTheDocument()
    })

    it('persists an entered value under enhancementLabLevel, independent of the discount Labs', async () => {
      const user = userEvent.setup()
      const { unmount } = render(<LabsInputs />)

      const unlockInput = screen.getByLabelText('Workshop Enhancements Lab')
      await user.clear(unlockInput)
      await user.type(unlockInput, '1')

      expect(JSON.parse(window.localStorage.getItem('enhancementLabLevel'))).toBe(1)
      expect(JSON.parse(window.localStorage.getItem('workshopDiscountLabs'))).toEqual({})

      unmount()
      render(<LabsInputs />)
      expect(screen.getByLabelText('Workshop Enhancements Lab')).toHaveValue(1)
      expect(screen.getByText('Unlocked')).toBeInTheDocument()
    })

    it('hard-caps the entered value at 1, its own max', () => {
      render(<LabsInputs />)

      fireEvent.change(screen.getByLabelText('Workshop Enhancements Lab'), { target: { value: '99' } })

      expect(screen.getByLabelText('Workshop Enhancements Lab')).toHaveValue(1)
    })
  })
})
