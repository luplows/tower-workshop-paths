import { expect, test } from '@playwright/test'
import { ENHANCEMENT_CATEGORIES } from '../src/data/enhancementCategories.js'
import { WORKSHOP_CATEGORIES } from '../src/data/workshopCategories.js'
import { WORKSHOP_UNLOCK_GROUPS } from '../src/data/workshopUnlockGroups.js'
import { unlockGroupKey } from '../src/utils/workshopUnlockGroups.js'

const allUnlockedGroups = () => {
  const unlocked = {}
  for (const [categoryId, groups] of Object.entries(WORKSHOP_UNLOCK_GROUPS)) {
    for (const group of groups) unlocked[unlockGroupKey(categoryId, group.name)] = true
  }
  return unlocked
}

const maxedLevels = (categories) => {
  const levels = {}
  for (const category of categories) {
    for (const upgrade of category.upgrades) levels[upgrade.name] = upgrade.quantity
  }
  return levels
}

test.beforeEach(async ({ page }) => {
  // Every Workshop upgrade-unlock group already purchased (OQ-5) -- these
  // tests are about the discount Labs themselves, not the unlock gate (see
  // e2e/workshop-inputs.spec.js for a dedicated OQ-5 test); without this, a
  // cheap unlock-group cost would crowd out whatever a test is isolating in
  // the Path list.
  await page.addInitScript((unlocked) => {
    window.localStorage.setItem('workshopUnlockedGroups', JSON.stringify(unlocked))
  }, allUnlockedGroups())
  await page.goto('/')
  await page.getByRole('tab', { name: 'Labs', exact: true }).click()
})

test('shows all 3 Workshop discount Labs at once, each labeled by its own tree', async ({ page }) => {
  await expect(page.getByLabel('Attack Discount Lab', { exact: true })).toBeVisible()
  await expect(page.getByLabel('Defense Discount Lab', { exact: true })).toBeVisible()
  await expect(page.getByLabel('Utility Discount Lab', { exact: true })).toBeVisible()
  // No tree-tab navigation here, unlike Upgrade/Enhance -- everything is on
  // one flat page.
  await expect(page.getByRole('tab', { name: 'Attack', exact: true })).not.toBeVisible()
})

test('persists an entered discount Lab level, independently per tree', async ({ page }) => {
  const attackDiscount = page.getByLabel('Attack Discount Lab', { exact: true })
  await attackDiscount.fill('20')
  await attackDiscount.blur()
  await expect(page.getByText('10.0% off')).toBeVisible()

  await expect(page.getByLabel('Defense Discount Lab', { exact: true })).toHaveValue('0')

  await page.reload()
  await expect(page.getByLabel('Attack Discount Lab', { exact: true })).toHaveValue('20')
  await expect(page.getByLabel('Defense Discount Lab', { exact: true })).toHaveValue('0')
})

test('reflects an entered discount Lab level in the Path list (OQ-4)', async ({ page }) => {
  // Multishot Targets (Attack) costs 450 undiscounted -- 10% off at Attack
  // discount Lab level 20.
  const attackDiscount = page.getByLabel('Attack Discount Lab', { exact: true })
  await attackDiscount.fill('20')
  await attackDiscount.blur()

  await page.getByRole('tab', { name: 'Path', exact: true }).click()

  const list = page.getByRole('list', { name: 'Recommended buy order' })
  const firstRow = list.getByRole('listitem').first()
  await expect(firstRow).toContainText('Multishot Targets')
  await expect(firstRow).toContainText('405 coins')
})

test('unlocking Workshop Enhancements here shows up on the Enhance screen and the Path list too (OQ-31)', async ({
  page,
}) => {
  const unlockInput = page.getByLabel('Workshop Enhancements Lab', { exact: true })
  await expect(unlockInput).toHaveValue('0')
  await expect(page.getByText('Locked', { exact: true })).toBeVisible()

  await unlockInput.fill('1')
  await unlockInput.blur()
  await expect(page.getByText('Unlocked', { exact: true })).toBeVisible()

  await page.getByRole('tab', { name: 'Input', exact: true }).click()
  await page.getByRole('tab', { name: 'Enhance', exact: true }).click()
  await expect(page.getByLabel('Damage +', { exact: true })).toBeVisible()
  await expect(page.getByText('Workshop Enhancements are locked')).not.toBeVisible()

  await page.getByRole('tab', { name: 'Path', exact: true }).click()
  await expect(page.getByText('Workshop Enhancements Lab')).not.toBeVisible()
})

test('shows all 3 Enhancement discount Labs below the Workshop Enhancements unlock, each labeled by its own tree (OQ-37)', async ({
  page,
}) => {
  await expect(page.getByLabel('Attack Enhancement Discount Lab', { exact: true })).toBeVisible()
  await expect(page.getByLabel('Defense Enhancement Discount Lab', { exact: true })).toBeVisible()
  await expect(page.getByLabel('Utility Enhancement Discount Lab', { exact: true })).toBeVisible()
})

test('persists an entered Enhancement discount Lab level, independently per tree and from the Workshop discount Labs', async ({
  page,
}) => {
  const attackDiscount = page.getByLabel('Attack Enhancement Discount Lab', { exact: true })
  await attackDiscount.fill('10')
  await attackDiscount.blur()
  await expect(page.getByText('3.0% off')).toBeVisible()

  await expect(page.getByLabel('Defense Enhancement Discount Lab', { exact: true })).toHaveValue('0')
  await expect(page.getByLabel('Attack Discount Lab', { exact: true })).toHaveValue('0')

  await page.reload()
  await expect(page.getByLabel('Attack Enhancement Discount Lab', { exact: true })).toHaveValue('10')
})

test('reflects an entered Enhancement discount Lab level in the Path list (OQ-37)', async ({ page }) => {
  // Every Workshop upgrade maxed, every Enhancement maxed except one
  // (Recovery Package, Utility), so that lone Enhancement is unambiguously
  // the only, first row -- same fixture shape as e2e/upgrade-path.spec.js's
  // own OQ-29 test. Recovery Package costs 5B undiscounted at level 0 --
  // 30% off at the Utility Enhancement discount Lab's max level (100).
  const workshopLevels = maxedLevels(WORKSHOP_CATEGORIES)
  const enhancementLevels = maxedLevels(ENHANCEMENT_CATEGORIES)
  delete enhancementLevels['Recovery Package']

  await page.addInitScript(
    ([workshop, enhancement]) => {
      window.localStorage.setItem('workshopLevels', JSON.stringify(workshop))
      window.localStorage.setItem('enhancementLevels', JSON.stringify(enhancement))
      window.localStorage.setItem('enhancementLabLevel', JSON.stringify(1))
    },
    [workshopLevels, enhancementLevels],
  )
  await page.reload()

  const utilityDiscount = page.getByLabel('Utility Enhancement Discount Lab', { exact: true })
  await utilityDiscount.fill('100')
  await utilityDiscount.blur()

  await page.getByRole('tab', { name: 'Path', exact: true }).click()

  const list = page.getByRole('list', { name: 'Recommended buy order' })
  const firstRow = list.getByRole('listitem').first()
  await expect(firstRow).toContainText('Recovery Package +')
  await expect(firstRow).toContainText('3.5B coins')
})
