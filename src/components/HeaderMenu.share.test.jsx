import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { HeaderMenu } from './HeaderMenu'
import { clearStoredValue, useLocalStorageState } from '../hooks/useLocalStorageState'
import { decodeTower } from '../utils/shareCodec'
import { SHARE_PARAM } from '../utils/shareLink'
import { TOWER_DATA_KEYS } from '../storageKeys'

// userEvent.setup() installs its own navigator.clipboard, so the stub goes in
// after it.
const openShare = async (clipboard) => {
  const user = userEvent.setup()
  Object.defineProperty(navigator, 'clipboard', { value: clipboard, configurable: true })
  render(<HeaderMenu onClearAllLevels={vi.fn()} />)
  await user.click(screen.getByRole('button', { name: 'More actions' }))
  await user.click(screen.getByText('Copy share link'))
}

const storedSnapshot = () =>
  JSON.stringify(Object.keys(window.localStorage).sort().map((key) => [key, window.localStorage.getItem(key)]))

describe('HeaderMenu share link (OQ-57)', () => {
  beforeEach(() => {
    window.localStorage.clear()
    window.localStorage.setItem('workshopLevels', JSON.stringify({ Damage: 7 }))
    window.localStorage.setItem('themePreference', JSON.stringify('dark'))
  })

  it('OQ-57/AC-1 and AC-2 write an absolute link to the clipboard and confirm it', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    await openShare({ writeText })

    expect(await screen.findByRole('status')).toHaveTextContent('Share link copied')
    expect(writeText).toHaveBeenCalledTimes(1)
    expect(writeText.mock.calls[0][0]).toMatch(/^http:\/\/localhost(:\d+)?\/\?tower=[\w-]+$/)
  })

  it('OQ-57/AC-3 leaves stored data unchanged', async () => {
    const before = storedSnapshot()
    await openShare({ writeText: vi.fn().mockResolvedValue(undefined) })
    await screen.findByRole('status')

    expect(storedSnapshot()).toBe(before)
  })

  it('OQ-57/AC-4 reports why and shows no link when the URL is over budget', async () => {
    const writeText = vi.fn()
    window.localStorage.setItem('buyOutLabCoinsSpent', JSON.stringify('x'.repeat(3000)))
    await openShare({ writeText })

    expect(await screen.findByRole('status')).toHaveTextContent('over the 2000')
    expect(writeText).not.toHaveBeenCalled()
    expect(screen.queryByLabelText('Share link')).not.toBeInTheDocument()
  })

  it('OQ-57/AC-5 displays the URL for manual copying when the clipboard write is refused', async () => {
    await openShare({ writeText: vi.fn().mockRejectedValue(new Error('denied')) })

    expect((await screen.findByLabelText('Share link')).value).toMatch(/\?tower=[\w-]+$/)
  })

  it('OQ-57/AC-5 displays the URL when the clipboard is unavailable', async () => {
    await openShare(undefined)

    expect(await screen.findByLabelText('Share link')).toBeInTheDocument()
  })

  describe('when storage cannot be written', () => {
    afterEach(() => {
      vi.restoreAllMocks()
      clearStoredValue(TOWER_DATA_KEYS.workshopLevels)
    })

    it('OQ-57/AC-1 shares the levels on screen, not the older stored ones', async () => {
      const Levels = () => {
        const [levels, setLevels] = useLocalStorageState(TOWER_DATA_KEYS.workshopLevels, {})
        return (
          <button type="button" onClick={() => setLevels({ Damage: 42 })}>
            Damage {levels.Damage}
          </button>
        )
      }
      const user = userEvent.setup()
      const writeText = vi.fn().mockResolvedValue(undefined)
      Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
      render(
        <>
          <Levels />
          <HeaderMenu onClearAllLevels={vi.fn()} />
        </>,
      )
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError')
      })
      await user.click(screen.getByText('Damage 7'))
      expect(screen.getByText('Damage 42')).toBeInTheDocument()
      expect(JSON.parse(window.localStorage.getItem(TOWER_DATA_KEYS.workshopLevels))).toEqual({ Damage: 7 })

      await user.click(screen.getByRole('button', { name: 'More actions' }))
      await user.click(screen.getByText('Copy share link'))
      expect(await screen.findByRole('status')).toHaveTextContent('Share link copied')

      const payload = new URL(writeText.mock.calls[0][0]).searchParams.get(SHARE_PARAM)
      expect(decodeTower(payload).tower.workshopLevels.Damage).toBe(42)
    })
  })
  describe('when storage is blocked entirely', () => {
    const original = Object.getOwnPropertyDescriptor(window, 'localStorage')

    afterEach(() => {
      if (original) Object.defineProperty(window, 'localStorage', original)
      else delete window.localStorage
      clearStoredValue(TOWER_DATA_KEYS.workshopLevels)
    })

    it('OQ-57/AC-1 shares the levels on screen when reaching window.localStorage throws', async () => {
      Object.defineProperty(window, 'localStorage', {
        configurable: true,
        get() {
          throw new DOMException('The operation is insecure.', 'SecurityError')
        },
      })
      const Levels = () => {
        const [levels, setLevels] = useLocalStorageState(TOWER_DATA_KEYS.workshopLevels, {})
        return (
          <button type="button" onClick={() => setLevels({ Damage: 42 })}>
            Damage {levels.Damage ?? 0}
          </button>
        )
      }
      const user = userEvent.setup()
      const writeText = vi.fn().mockResolvedValue(undefined)
      Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
      render(
        <>
          <Levels />
          <HeaderMenu onClearAllLevels={vi.fn()} />
        </>,
      )
      await user.click(screen.getByText('Damage 0'))
      expect(screen.getByText('Damage 42')).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: 'More actions' }))
      await user.click(screen.getByText('Copy share link'))
      expect(await screen.findByRole('status')).toHaveTextContent('Share link copied')

      const payload = new URL(writeText.mock.calls[0][0]).searchParams.get(SHARE_PARAM)
      expect(decodeTower(payload).tower.workshopLevels.Damage).toBe(42)
    })
  })
})
