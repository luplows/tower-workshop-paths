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
  await damageInput.fill('5')
  await damageInput.blur()

  await page.getByRole('tab', { name: 'Path', exact: true }).click()

  const list = page.getByRole('list', { name: 'Cheapest next upgrades' })
  const damageRow = list.getByText('Damage', { exact: true }).locator('xpath=..')
  await expect(damageRow).toContainText('Lv 5 → 6')
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
