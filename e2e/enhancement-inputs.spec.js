import { expect, test } from '@playwright/test'

test.describe('with the Workshop Enhancements Lab already unlocked', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('enhancementLabLevel', JSON.stringify(1))
    })
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

  test("locks a later category in a tree until that tree's cumulative spend crosses its threshold (OQ-6)", async ({
    page,
  }) => {
    await expect(page.getByText(/Rend Armor \+/)).toBeVisible()
    await expect(page.getByLabel('Rend Armor +', { exact: true })).not.toBeVisible()
    await expect(page.getByText(/Locked until 50B coins spent in this tree/)).toBeVisible()

    // Damage at level 10 has spent ~55.5B coins, just past Rend Armor's 50B
    // threshold.
    const damageInput = page.getByLabel('Damage +', { exact: true })
    await damageInput.fill('10')
    await damageInput.blur()

    await expect(page.getByLabel('Rend Armor +', { exact: true })).toBeVisible()
    await expect(page.getByText(/Locked until 50B coins/)).not.toBeVisible()
  })
})

test('shows a lock prompt instead of inputs until the Workshop Enhancements Lab is unlocked (OQ-32)', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('tab', { name: 'Enhance', exact: true }).click()

  await expect(page.getByText('Workshop Enhancements are locked')).toBeVisible()
  await expect(page.getByLabel('Damage +', { exact: true })).not.toBeVisible()

  await page.getByRole('button', { name: 'Unlock (5B coins)' }).click()

  await expect(page.getByText('Workshop Enhancements are locked')).not.toBeVisible()
  await expect(page.getByLabel('Damage +', { exact: true })).toBeVisible()
})
