import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { UpgradeLevelInput } from './UpgradeLevelInput'

describe('UpgradeLevelInput', () => {
  const upgrade = { name: 'Thorns', min: 0, max: 99, quantity: 99, cost: 2330000 }

  it('renders the max level as a hard input bound', () => {
    render(<UpgradeLevelInput upgrade={upgrade} level={0} onChange={() => {}} />)
    const input = screen.getByLabelText('Thorns')
    expect(input).toHaveAttribute('min', '0')
    expect(input).toHaveAttribute('max', '99')
    expect(screen.getByText('/ 99')).toBeInTheDocument()
  })

  it('reports a clamped value when the entered level exceeds the max', () => {
    const onChange = vi.fn()
    render(<UpgradeLevelInput upgrade={upgrade} level={0} onChange={onChange} />)

    fireEvent.change(screen.getByLabelText('Thorns'), { target: { value: '500' } })

    expect(onChange).toHaveBeenLastCalledWith(99)
  })

  it('renders no max bound when the upgrade has no known quantity', () => {
    const unbounded = { name: 'Rend Armor' }
    render(<UpgradeLevelInput upgrade={unbounded} level={0} onChange={() => {}} />)

    const input = screen.getByLabelText('Rend Armor')
    expect(input).not.toHaveAttribute('max')
    expect(screen.queryByText(/^\//)).not.toBeInTheDocument()
  })

  it('does not clamp an entered level when there is no known max', () => {
    const onChange = vi.fn()
    const unbounded = { name: 'Rend Armor' }
    render(<UpgradeLevelInput upgrade={unbounded} level={0} onChange={onChange} />)

    fireEvent.change(screen.getByLabelText('Rend Armor'), { target: { value: '500' } })

    expect(onChange).toHaveBeenLastCalledWith(500)
  })

  it('renders no computed value when formatValue is not provided', () => {
    render(<UpgradeLevelInput upgrade={upgrade} level={40} onChange={() => {}} />)
    expect(screen.queryByText(/×/)).not.toBeInTheDocument()
  })

  it('renders a computed value from formatValue when provided', () => {
    const formatValue = (level) => `${level}!`
    render(
      <UpgradeLevelInput
        upgrade={upgrade}
        level={40}
        onChange={() => {}}
        formatValue={formatValue}
      />,
    )
    expect(screen.getByText('40!')).toBeInTheDocument()
  })
})
