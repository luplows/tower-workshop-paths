import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test('keeps the header and mode tab bar visible while scrolling the Upgrade screen', async ({
  page,
}) => {
  const header = page.getByRole('heading', { name: 'Workshop Input' })
  const upgradeTab = page.getByRole('tab', { name: 'Upgrade', exact: true })
  await expect(header).toBeInViewport()
  await expect(upgradeTab).toBeInViewport()

  await page.mouse.wheel(0, 2000)

  await expect(header).toBeInViewport()
  await expect(upgradeTab).toBeInViewport()
})

test('keeps the header visible while scrolling the Path screen', async ({ page }) => {
  await page.getByRole('tab', { name: 'Path', exact: true }).click()

  await page.mouse.wheel(0, 2000)

  await expect(page.getByRole('heading', { name: 'Workshop Input' })).toBeInViewport()
  await expect(page.getByRole('tab', { name: 'Input', exact: true })).toBeInViewport()
})
