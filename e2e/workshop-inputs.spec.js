import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test('shows the Attack tab by default', async ({ page }) => {
  await expect(page.getByLabel('Damage', { exact: true })).toBeVisible()
  await expect(page.getByLabel('Health', { exact: true })).not.toBeVisible()
})

test('switches to another category tab on click', async ({ page }) => {
  await page.getByRole('tab', { name: 'Defense', exact: true }).click()

  await expect(page.getByLabel('Health', { exact: true })).toBeVisible()
  await expect(page.getByLabel('Damage', { exact: true })).not.toBeVisible()
})

test('persists an entered level across a page reload', async ({ page }) => {
  const damageInput = page.getByLabel('Damage', { exact: true })
  await damageInput.fill('250')
  await damageInput.blur()

  await page.reload()

  await expect(page.getByLabel('Damage', { exact: true })).toHaveValue('250')
})

test('hard-caps an entered level at the upgrade max', async ({ page }) => {
  await page.getByRole('tab', { name: 'Defense', exact: true }).click()

  const thornsInput = page.getByLabel('Thorns', { exact: true })
  await thornsInput.fill('9999')
  await thornsInput.blur()

  await expect(thornsInput).toHaveValue('99')
})
