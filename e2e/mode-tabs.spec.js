import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test('defaults to Upgrade mode, showing Workshop upgrade categories', async ({ page }) => {
  await expect(
    page.getByRole('tab', { name: 'Upgrade', exact: true }),
  ).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByRole('tab', { name: 'Attack Upgrades' })).toBeVisible()
})

test('switches to Enhance mode on click, showing Enhancement categories', async ({
  page,
}) => {
  await page.getByRole('tab', { name: 'Enhance', exact: true }).click()

  await expect(page.getByRole('tab', { name: 'Attack Enhancements' })).toBeVisible()
  await expect(page.getByRole('tab', { name: 'Attack Upgrades' })).not.toBeVisible()
})

test('keeps Upgrade and Enhance level entries independent across a reload', async ({
  page,
}) => {
  const upgradeDamageInput = page.getByLabel('Damage', { exact: true })
  await upgradeDamageInput.fill('10')
  await upgradeDamageInput.blur()

  await page.getByRole('tab', { name: 'Enhance', exact: true }).click()
  const enhanceDamageInput = page.getByLabel('Damage', { exact: true })
  await enhanceDamageInput.fill('3')
  await enhanceDamageInput.blur()

  await page.reload()

  await expect(
    page.getByRole('tab', { name: 'Enhance', exact: true }),
  ).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByLabel('Damage', { exact: true })).toHaveValue('3')

  await page.getByRole('tab', { name: 'Upgrade', exact: true }).click()
  await expect(page.getByLabel('Damage', { exact: true })).toHaveValue('10')
})
