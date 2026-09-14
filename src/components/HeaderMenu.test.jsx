import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { HeaderMenu } from './HeaderMenu'

describe('HeaderMenu', () => {
  it('shows the Clear all levels item only after opening the menu', async () => {
    const user = userEvent.setup()
    render(<HeaderMenu onClearAllLevels={vi.fn()} />)

    expect(screen.queryByText('Clear all levels')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'More actions' }))
    expect(screen.getByText('Clear all levels')).toBeInTheDocument()
  })

  it('asks for confirmation before clearing, without calling onClearAllLevels yet', async () => {
    const onClearAllLevels = vi.fn()
    const user = userEvent.setup()
    render(<HeaderMenu onClearAllLevels={onClearAllLevels} />)

    await user.click(screen.getByRole('button', { name: 'More actions' }))
    await user.click(screen.getByText('Clear all levels'))

    expect(screen.getByRole('alertdialog')).toHaveTextContent(
      'Clear all entered levels?',
    )
    expect(onClearAllLevels).not.toHaveBeenCalled()
  })

  it('does nothing if the confirmation is cancelled', async () => {
    const onClearAllLevels = vi.fn()
    const user = userEvent.setup()
    render(<HeaderMenu onClearAllLevels={onClearAllLevels} />)

    await user.click(screen.getByRole('button', { name: 'More actions' }))
    await user.click(screen.getByText('Clear all levels'))
    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(onClearAllLevels).not.toHaveBeenCalled()
  })

  it('calls onClearAllLevels only once the confirmation is accepted', async () => {
    const onClearAllLevels = vi.fn()
    const user = userEvent.setup()
    render(<HeaderMenu onClearAllLevels={onClearAllLevels} />)

    await user.click(screen.getByRole('button', { name: 'More actions' }))
    await user.click(screen.getByText('Clear all levels'))
    await user.click(screen.getByRole('button', { name: 'Clear' }))

    expect(onClearAllLevels).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  })

  it('closes the dropdown when clicking outside it', async () => {
    const user = userEvent.setup()
    render(
      <div>
        <HeaderMenu onClearAllLevels={vi.fn()} />
        <button type="button">Outside</button>
      </div>,
    )

    await user.click(screen.getByRole('button', { name: 'More actions' }))
    expect(screen.getByText('Clear all levels')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Outside' }))
    expect(screen.queryByText('Clear all levels')).not.toBeInTheDocument()
  })

  describe('theme toggle', () => {
    it('shows Auto/Light/Dark, with the current preference checked', async () => {
      const user = userEvent.setup()
      render(
        <HeaderMenu
          onClearAllLevels={vi.fn()}
          themePreference="dark"
          onThemeChange={vi.fn()}
        />,
      )

      await user.click(screen.getByRole('button', { name: 'More actions' }))

      expect(screen.getByRole('radio', { name: 'Auto' })).toHaveAttribute(
        'aria-checked',
        'false',
      )
      expect(screen.getByRole('radio', { name: 'Light' })).toHaveAttribute(
        'aria-checked',
        'false',
      )
      expect(screen.getByRole('radio', { name: 'Dark' })).toHaveAttribute(
        'aria-checked',
        'true',
      )
    })

    it('calls onThemeChange with the chosen option', async () => {
      const onThemeChange = vi.fn()
      const user = userEvent.setup()
      render(
        <HeaderMenu
          onClearAllLevels={vi.fn()}
          themePreference="auto"
          onThemeChange={onThemeChange}
        />,
      )

      await user.click(screen.getByRole('button', { name: 'More actions' }))
      await user.click(screen.getByRole('radio', { name: 'Light' }))

      expect(onThemeChange).toHaveBeenCalledWith('light')
    })

    it("doesn't close the dropdown when a theme is picked, unlike Clear all levels", async () => {
      const user = userEvent.setup()
      render(
        <HeaderMenu
          onClearAllLevels={vi.fn()}
          themePreference="auto"
          onThemeChange={vi.fn()}
        />,
      )

      await user.click(screen.getByRole('button', { name: 'More actions' }))
      await user.click(screen.getByRole('radio', { name: 'Dark' }))

      expect(screen.getByText('Clear all levels')).toBeInTheDocument()
    })
  })
})
