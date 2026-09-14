import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test('shows the cheapest not-yet-maxed upgrade first, batched (OQ-7)', async ({ page }) => {
  await page.getByRole('tab', { name: 'Path', exact: true }).click()

  const list = page.getByRole('list', { name: 'Cheapest next upgrades' })
  const firstRow = list.getByRole('listitem').first()

  await expect(firstRow).toContainText('Multishot Targets')
  await expect(firstRow).toContainText('450 coins')
  await expect(firstRow).toContainText('Lv 0 → 1')
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

test('buying a row updates the entered level and the Upgrade screen (OQ-18)', async ({
  page,
}) => {
  await page.getByRole('tab', { name: 'Path', exact: true }).click()

  const list = page.getByRole('list', { name: 'Cheapest next upgrades' })
  const firstRow = list.getByRole('listitem').first()
  await expect(firstRow).toContainText('Multishot Targets')

  await firstRow.getByRole('button', { name: 'Buy 1 level of Multishot Targets' }).click()

  // Re-ranks immediately: the next-cheapest row is now first.
  await expect(list.getByRole('listitem').first()).toContainText('Bounce Shot Targets')

  await page.getByRole('tab', { name: 'Input', exact: true }).click()
  await expect(page.getByLabel('Multishot Targets', { exact: true })).toHaveValue('1')
})

test('asks for confirmation before buying a later occurrence of a repeated upgrade', async ({
  page,
}) => {
  await page.getByRole('tab', { name: 'Path', exact: true }).click()

  const list = page.getByRole('list', { name: 'Cheapest next upgrades' })
  const rows = list.getByText('Multishot Targets', { exact: true })
  await expect(rows).toHaveCount(4)

  const secondRow = rows.nth(1).locator('xpath=..')
  await secondRow.getByRole('button', { name: /^Buy/ }).click()

  const dialog = page.getByRole('alertdialog')
  await expect(dialog).toContainText('Multishot Targets appears earlier in this list')

  await dialog.getByRole('button', { name: 'Buy all 2' }).click()
  await expect(dialog).not.toBeVisible()

  await page.getByRole('tab', { name: 'Input', exact: true }).click()
  await expect(page.getByLabel('Multishot Targets', { exact: true })).toHaveValue('2')
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
