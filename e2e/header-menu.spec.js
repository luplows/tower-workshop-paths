import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  // Unlocked by default -- these tests are about Clear itself, not the
  // Workshop Enhancements Lab gate (see enhancement-inputs.spec.js).
  await page.addInitScript(() => {
    window.localStorage.setItem('enhancementLabLevel', JSON.stringify(1))
  })
  await page.goto('/')
})

test('clears entered levels only after confirming (OQ-22)', async ({ page }) => {
  const damageInput = page.getByLabel('Damage', { exact: true })
  await damageInput.fill('250')
  await damageInput.blur()

  await page.getByRole('button', { name: 'More actions' }).click()
  await page.getByText('Clear all levels', { exact: true }).click()

  const dialog = page.getByRole('alertdialog')
  await expect(dialog).toContainText('Clear all entered levels?')

  // Cancelling leaves the entered level untouched.
  await dialog.getByRole('button', { name: 'Cancel' }).click()
  await expect(dialog).not.toBeVisible()
  await expect(damageInput).toHaveValue('250')

  await page.getByRole('button', { name: 'More actions' }).click()
  await page.getByText('Clear all levels', { exact: true }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Clear' }).click()

  await expect(damageInput).toHaveValue('0')
})

test('clears both Upgrade and Enhance levels together', async ({ page }) => {
  const upgradeDamageInput = page.getByLabel('Damage', { exact: true })
  await upgradeDamageInput.fill('10')
  await upgradeDamageInput.blur()

  await page.getByRole('tab', { name: 'Enhance', exact: true }).click()
  const enhanceDamageInput = page.getByLabel('Damage +', { exact: true })
  await enhanceDamageInput.fill('3')
  await enhanceDamageInput.blur()

  await page.getByRole('button', { name: 'More actions' }).click()
  await page.getByText('Clear all levels', { exact: true }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Clear' }).click()

  // The Lab is re-locked too (OQ-32), so the Enhance screen now shows its
  // lock prompt in place of a zeroed-out input.
  await expect(page.getByText('Workshop Enhancements are locked')).toBeVisible()

  await page.getByRole('tab', { name: 'Upgrade', exact: true }).click()
  await expect(page.getByLabel('Damage', { exact: true })).toHaveValue('0')
})

test('switches the theme via the Auto/Light/Dark toggle, persisting across a reload', async ({
  page,
}) => {
  const html = page.locator('html')
  await expect(html).not.toHaveAttribute('data-theme')

  await page.getByRole('button', { name: 'More actions' }).click()
  await page.getByRole('radio', { name: 'Dark' }).click()
  await expect(html).toHaveAttribute('data-theme', 'dark')

  await page.getByRole('radio', { name: 'Light' }).click()
  await expect(html).toHaveAttribute('data-theme', 'light')

  await page.reload()
  await expect(html).toHaveAttribute('data-theme', 'light')

  await page.getByRole('button', { name: 'More actions' }).click()
  await page.getByRole('radio', { name: 'Auto' }).click()
  await expect(html).not.toHaveAttribute('data-theme')
})
