import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.getByRole('tab', { name: 'Path', exact: true }).click()
})

test('shows the cheapest not-yet-maxed upgrade first', async ({ page }) => {
  const list = page.getByRole('list', { name: 'Cheapest next upgrades' })
  const firstRow = list.getByRole('listitem').first()

  await expect(firstRow).toContainText('Attack Speed')
  await expect(firstRow).toContainText('30 coins')
  await expect(firstRow).toContainText('Lv 0 → 1')
})

test('reflects a level entered on the Upgrade screen', async ({ page }) => {
  await page.getByRole('tab', { name: 'Upgrade', exact: true }).click()
  const damageInput = page.getByLabel('Damage', { exact: true })
  await damageInput.fill('5')
  await damageInput.blur()

  await page.getByRole('tab', { name: 'Path', exact: true }).click()

  const list = page.getByRole('list', { name: 'Cheapest next upgrades' })
  const damageRow = list.getByText('Damage', { exact: true }).locator('xpath=..')
  await expect(damageRow).toContainText('Lv 5 → 6')
})
