import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test('shows the cheapest not-yet-maxed upgrade first, batched (OQ-7)', async ({ page }) => {
  await page.getByRole('tab', { name: 'Path', exact: true }).click()

  const list = page.getByRole('list', { name: 'Cheapest next upgrades' })
  const firstRow = list.getByRole('listitem').first()

  await expect(firstRow).toContainText('Critical Factor')
  await expect(firstRow).toContainText('2,645 coins')
  await expect(firstRow).toContainText('Lv 0 → 10')
})

test('reflects a level entered on the Upgrade screen', async ({ page }) => {
  const attackSpeedInput = page.getByLabel('Attack Speed', { exact: true })
  await attackSpeedInput.fill('1')
  await attackSpeedInput.blur()

  await page.getByRole('tab', { name: 'Path', exact: true }).click()

  // Attack Speed can legitimately appear more than once (OQ-19) -- its
  // first, cheapest occurrence should start from the entered level,
  // batched 10 levels at a time since its max level is under 1000 (OQ-7).
  const list = page.getByRole('list', { name: 'Cheapest next upgrades' })
  const row = list.getByText('Attack Speed', { exact: true }).first().locator('xpath=..')
  await expect(row).toContainText('Lv 1 → 11')
})

test('lets a cheap upgrade appear more than once (OQ-19)', async ({ page }) => {
  await page.getByRole('tab', { name: 'Path', exact: true }).click()

  const list = page.getByRole('list', { name: 'Cheapest next upgrades' })
  const rows = list.getByText('Critical Factor', { exact: true })

  await expect(rows).toHaveCount(2)
  await expect(rows.nth(0).locator('xpath=..')).toContainText('Lv 0 → 10')
  await expect(rows.nth(1).locator('xpath=..')).toContainText('Lv 10 → 20')
})

test('keeps Path on a separate control from the Upgrade/Enhance toggle', async ({
  page,
}) => {
  await expect(page.getByRole('tab', { name: 'Upgrade', exact: true })).toBeVisible()
  await expect(page.getByRole('tab', { name: 'Enhance', exact: true })).toBeVisible()

  await page.getByRole('tab', { name: 'Path', exact: true }).click()

  // Path replaces the Upgrade/Enhance toggle entirely -- it isn't a third
  // option alongside them, since there's no "Path" button in the game.
  await expect(page.getByRole('tab', { name: 'Upgrade', exact: true })).not.toBeVisible()
  await expect(page.getByRole('tab', { name: 'Enhance', exact: true })).not.toBeVisible()

  await page.getByRole('tab', { name: 'Input', exact: true }).click()
  await expect(page.getByRole('tab', { name: 'Upgrade', exact: true })).toBeVisible()
})
