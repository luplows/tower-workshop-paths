import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

const unlockGroup = (page, key) =>
  page.addInitScript((k) => {
    window.localStorage.setItem('workshopUnlockedGroups', JSON.stringify({ [k]: true }))
  }, key)

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
  // Thorns belongs to Defense's paid "Thorn Upgrades" unlock group (OQ-5) --
  // unlock it so its input is reachable at all.
  await unlockGroup(page, 'defense:Thorn Upgrades')
  await page.goto('/')
  await page.getByRole('tab', { name: 'Defense', exact: true }).click()

  const thornsInput = page.getByLabel('Thorns', { exact: true })
  await thornsInput.fill('9999')
  await thornsInput.blur()

  await expect(thornsInput).toHaveValue('99')
})

test('shows a locked group as an inline Unlock button, and buying it reveals the normal input (OQ-5)', async ({
  page,
}) => {
  await page.getByRole('tab', { name: 'Defense', exact: true }).click()

  await expect(page.getByLabel('Thorns', { exact: true })).not.toBeVisible()
  await expect(page.getByText('Thorns', { exact: true })).toBeVisible()
  const unlockButton = page.getByRole('button', { name: 'Unlock "Thorn Upgrades" (500 coins)' })
  await expect(unlockButton).toBeVisible()

  await unlockButton.click()

  await expect(page.getByLabel('Thorns', { exact: true })).toBeVisible()
  await expect(unlockButton).not.toBeVisible()

  await page.reload()
  await page.getByRole('tab', { name: 'Defense', exact: true }).click()
  await expect(page.getByLabel('Thorns', { exact: true })).toBeVisible()
})
