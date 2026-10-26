import { expect, test } from '@playwright/test'

test('OQ-8/AC-8: lifetime coins and Labs spend produce a plan readable in both views', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('tab', { name: 'Labs', exact: true }).click()

  await page.getByLabel('Lifetime coins').fill('1500000')
  await page.getByLabel('Coins spent on Labs').fill('500000')
  await page.getByRole('button', { name: 'Plan buy-out' }).click()

  await expect(page.getByText(/Budget 1M coins, spent/)).toBeVisible()
  await expect(page.getByText(/budget runs out/)).toBeVisible()

  const purchases = page.getByRole('list', { name: 'Buy-out purchases' })
  await expect(purchases.getByRole('listitem').first()).toContainText('Lv 0 →')
  const summary = page.getByRole('list', { name: 'Buy-out summary' })
  await expect(summary.getByRole('listitem').first()).toContainText('purchase')
})

test('OQ-8/AC-7: coins spent on Labs above lifetime coins shows an error and no plan', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('tab', { name: 'Labs', exact: true }).click()

  await page.getByLabel('Lifetime coins').fill('100')
  await page.getByLabel('Coins spent on Labs').fill('200')
  await page.getByRole('button', { name: 'Plan buy-out' }).click()

  await expect(page.getByRole('alert')).toContainText('cannot exceed')
  await expect(page.getByRole('list', { name: 'Buy-out purchases' })).toHaveCount(0)
})
