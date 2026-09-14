import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AppSectionTabs } from './AppSectionTabs'

const SECTIONS = [
  { id: 'input', label: 'Input' },
  { id: 'path', label: 'Path' },
]

describe('AppSectionTabs', () => {
  it('renders a tab per section', () => {
    render(
      <AppSectionTabs sections={SECTIONS} activeSectionId="input" onSelect={() => {}} />,
    )

    expect(screen.getByRole('tab', { name: 'Input' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(screen.getByRole('tab', { name: 'Path' })).toHaveAttribute(
      'aria-selected',
      'false',
    )
  })

  it('reports the clicked section id', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(
      <AppSectionTabs sections={SECTIONS} activeSectionId="input" onSelect={onSelect} />,
    )

    await user.click(screen.getByRole('tab', { name: 'Path' }))

    expect(onSelect).toHaveBeenCalledWith('path')
  })

  it('uses its own tablist, separate from any game-mirroring tab bar', () => {
    render(
      <AppSectionTabs sections={SECTIONS} activeSectionId="input" onSelect={() => {}} />,
    )

    expect(screen.getByRole('tablist', { name: 'App section' })).toBeInTheDocument()
  })
})
