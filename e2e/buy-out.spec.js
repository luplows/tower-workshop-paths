import { expect, test } from '@playwright/test'

// Path → Respec (OQ-143/AC-7), not the Labs page the plan used to sit on.
const openRespec = async (page) => {
  await page.getByRole('tab', { name: 'Path', exact: true }).click()
  await page.getByRole('tab', { name: 'Respec', exact: true }).click()
}

test('OQ-143/AC-7: the Enhancements Lab set in the Respec view is set on the Labs page too', async ({
  page,
}) => {
  await page.goto('/')
  await openRespec(page)

  await page.getByLabel('Workshop Enhancements Lab').fill('1')

  await page.getByRole('tab', { name: 'Labs', exact: true }).click()
  await expect(page.getByLabel('Workshop Enhancements Lab')).toHaveValue('1')
  await expect(page.getByRole('button', { name: 'Plan buy-out' })).toHaveCount(0)
})

test('OQ-143/AC-7: a reload keeps Respec chosen', async ({ page }) => {
  await page.goto('/')
  await openRespec(page)
  await page.reload()

  await expect(page.getByRole('tab', { name: 'Respec', exact: true })).toHaveAttribute(
    'aria-selected',
    'true',
  )
  await expect(page.getByLabel('Lifetime coins')).toBeVisible()
})

test('OQ-8/AC-8: lifetime coins and Labs spend produce a plan readable in both views', async ({
  page,
}) => {
  await page.goto('/')
  await openRespec(page)

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
  await openRespec(page)

  await page.getByLabel('Lifetime coins').fill('100')
  await page.getByLabel('Coins spent on Labs').fill('200')
  await page.getByRole('button', { name: 'Plan buy-out' }).click()

  await expect(page.getByRole('alert')).toContainText('cannot exceed')
  await expect(page.getByRole('list', { name: 'Buy-out purchases' })).toHaveCount(0)
})

test('OQ-142/AC-6: short-form amounts plan a budget, and stay as typed after a reload', async ({ page }) => {
  await page.goto('/')
  await openRespec(page)

  await page.getByLabel('Lifetime coins').fill('1.18q')
  await page.getByLabel('Coins spent on Labs').fill('66.5T')
  await page.getByRole('button', { name: 'Plan buy-out' }).click()

  await expect(page.getByText(/Budget 1\.11q coins, spent/)).toBeVisible()

  // AC-4: each input keeps the text as typed.
  await page.reload()
  await expect(page.getByLabel('Lifetime coins')).toHaveValue('1.18q')
  await expect(page.getByLabel('Coins spent on Labs')).toHaveValue('66.5T')
})
