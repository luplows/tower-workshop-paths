import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.getByRole('tab', { name: 'Buyout', exact: true }).click()
})

test('OQ-8/AC-7: entering lifetime coins and coins spent on Labs reads a plan out of both views', async ({
  page,
}) => {
  await page.getByLabel('Lifetime coins', { exact: true }).fill('10000')
  await page.getByLabel('Coins spent on Labs', { exact: true }).fill('1000')

  await expect(page.getByText('Budget: 9k coins.')).toBeVisible()

  // Simulated from true zero -- no unlock group bought, no level entered --
  // the cheapest available step is unlocking Utility's "Cash Bonuses"
  // group, the same first row the Path list itself would show from this
  // same blank state (see the OQ-8/AC-8 test below).
  const rollupList = page.getByRole('list', { name: 'Simplified buyout plan' })
  await expect(rollupList.getByRole('listitem').first()).toContainText('Unlock: Cash Bonuses')
  await expect(rollupList.getByRole('listitem').first()).toContainText('40 coins')

  await page.getByRole('tab', { name: 'Granular', exact: true }).click()
  const granularList = page.getByRole('list', { name: 'Granular buyout plan' })
  await expect(granularList.getByRole('listitem').first()).toContainText('Unlock: Cash Bonuses')
})

test('OQ-8/AC-6: reports coins spent on Labs exceeding lifetime coins, instead of a plan', async ({
  page,
}) => {
  await page.getByLabel('Lifetime coins', { exact: true }).fill('100')
  await page.getByLabel('Coins spent on Labs', { exact: true }).fill('200')

  await expect(page.getByRole('alert')).toContainText('cannot exceed')
  await expect(page.getByText('Budget:')).not.toBeVisible()
})

test('OQ-8/AC-8: the existing Input/Path flow is unaffected by the Buyout section existing', async ({
  page,
}) => {
  await page.getByLabel('Lifetime coins', { exact: true }).fill('10000')
  await page.getByLabel('Coins spent on Labs', { exact: true }).fill('1000')

  await page.getByRole('tab', { name: 'Path', exact: true }).click()
  const list = page.getByRole('list', { name: 'Recommended buy order' })
  // Same blank, nothing-entered-or-unlocked state as the Buyout section's
  // own simulation (see the OQ-8/AC-7 test above) -- this is the Path
  // list's own ranking, untouched by anything entered on the Buyout
  // section.
  await expect(list.getByRole('listitem').first()).toContainText('Unlock: Cash Bonuses')
  await expect(list.getByRole('listitem').first()).toContainText('40 coins')
  await expect(list.getByRole('listitem').first()).toContainText('Lv 0 → 1')
})
