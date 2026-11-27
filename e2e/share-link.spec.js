import { expect, test } from '@playwright/test'

test('OQ-57/AC-1 copies a link for the current tower and confirms it', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/')
  const damageInput = page.getByLabel('Damage', { exact: true })
  await damageInput.fill('42')
  await damageInput.blur()

  await page.getByRole('button', { name: 'More actions' }).click()
  await page.getByText('Copy share link', { exact: true }).click()

  await expect(page.getByRole('status')).toContainText('Share link copied')
  const copied = await page.evaluate(() => navigator.clipboard.readText())
  // The link is the page's own origin and base path, then the payload.
  const pageBase = page.url().replace(/[?#].*$/, '')
  expect(copied.startsWith(`${pageBase}?tower=`)).toBe(true)
  expect(copied.slice(pageBase.length)).toMatch(/^\?tower=[\w-]+$/)
  // Generating the link does not touch the stored levels.
  await expect(damageInput).toHaveValue('42')
})

test('OQ-57/AC-5 shows the link for manual copying when the clipboard refuses', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: () => Promise.reject(new Error('denied')) },
      configurable: true,
    })
  })
  await page.goto('/')

  await page.getByRole('button', { name: 'More actions' }).click()
  await page.getByText('Copy share link', { exact: true }).click()

  await expect(page.getByLabel('Share link')).toHaveValue(/\?tower=[\w-]+$/)
})
