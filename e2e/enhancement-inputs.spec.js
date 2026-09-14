import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.getByRole('tab', { name: 'Enhance', exact: true }).click()
})

test('shows the Attack tree by default', async ({ page }) => {
  await expect(page.getByLabel('Damage +', { exact: true })).toBeVisible()
  await expect(page.getByLabel('Health +', { exact: true })).not.toBeVisible()
})

test('switches to another tree tab on click', async ({ page }) => {
  await page.getByRole('tab', { name: 'Defense', exact: true }).click()

  await expect(page.getByLabel('Health +', { exact: true })).toBeVisible()
  await expect(page.getByLabel('Damage +', { exact: true })).not.toBeVisible()
})

test('persists an entered level across a page reload', async ({ page }) => {
  const damageInput = page.getByLabel('Damage +', { exact: true })
  await damageInput.fill('40')
  await damageInput.blur()

  await page.reload()

  await expect(page.getByLabel('Damage +', { exact: true })).toHaveValue('40')
  await expect(page.getByText('1.40×')).toBeVisible()
})

test('hard-caps an entered level at the category max', async ({ page }) => {
  const damageInput = page.getByLabel('Damage +', { exact: true })
  await damageInput.fill('9999')
  await damageInput.blur()

  await expect(damageInput).toHaveValue('600')
})
