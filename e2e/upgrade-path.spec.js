import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test('shows the cheapest not-yet-maxed upgrade first', async ({ page }) => {
  await page.getByRole('tab', { name: 'Path', exact: true }).click()

  const list = page.getByRole('list', { name: 'Cheapest next upgrades' })
  const firstRow = list.getByRole('listitem').first()

  await expect(firstRow).toContainText('Attack Speed')
  await expect(firstRow).toContainText('30 coins')
  await expect(firstRow).toContainText('Lv 0 → 1')
})

test('reflects a level entered on the Upgrade screen', async ({ page }) => {
  const damageInput = page.getByLabel('Damage', { exact: true })
  await damageInput.fill('1')
  await damageInput.blur()

  await page.getByRole('tab', { name: 'Path', exact: true }).click()

  // Damage can legitimately appear more than once (OQ-19) -- its first,
  // cheapest occurrence should start from the entered level.
  const list = page.getByRole('list', { name: 'Cheapest next upgrades' })
  const damageRow = list.getByText('Damage', { exact: true }).first().locator('xpath=..')
  await expect(damageRow).toContainText('Lv 1 → 2')
})

test('lets a cheap upgrade appear more than once (OQ-19)', async ({ page }) => {
  await page.getByRole('tab', { name: 'Path', exact: true }).click()

  const list = page.getByRole('list', { name: 'Cheapest next upgrades' })
  const damageRows = list.getByText('Damage', { exact: true })

  await expect(damageRows).toHaveCount(3)
  await expect(damageRows.nth(0).locator('xpath=..')).toContainText('Lv 0 → 1')
  await expect(damageRows.nth(1).locator('xpath=..')).toContainText('Lv 1 → 2')
  await expect(damageRows.nth(2).locator('xpath=..')).toContainText('Lv 2 → 3')
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
