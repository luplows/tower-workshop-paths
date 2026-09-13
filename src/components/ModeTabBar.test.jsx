import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ModeTabBar } from './ModeTabBar'

const MODES = [
  { id: 'upgrade', label: 'Upgrade' },
  { id: 'enhance', label: 'Enhance' },
]

describe('ModeTabBar', () => {
  it('renders a tab per mode, matching the in-game button labels', () => {
    render(<ModeTabBar modes={MODES} activeModeId="upgrade" onSelect={() => {}} />)

    expect(screen.getByRole('tab', { name: 'Upgrade' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(screen.getByRole('tab', { name: 'Enhance' })).toHaveAttribute(
      'aria-selected',
      'false',
    )
  })

  it('reports the clicked mode id', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<ModeTabBar modes={MODES} activeModeId="upgrade" onSelect={onSelect} />)

    await user.click(screen.getByRole('tab', { name: 'Enhance' }))

    expect(onSelect).toHaveBeenCalledWith('enhance')
  })
})
