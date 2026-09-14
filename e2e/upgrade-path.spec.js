import { expect, test } from '@playwright/test'
import { ENHANCEMENT_CATEGORIES } from '../src/data/enhancementCategories.js'
import { WORKSHOP_CATEGORIES } from '../src/data/workshopCategories.js'
import { WORKSHOP_UNLOCK_GROUPS } from '../src/data/workshopUnlockGroups.js'
import { unlockGroupKey } from '../src/utils/workshopUnlockGroups.js'

const maxedLevels = (categories) => {
  const levels = {}
  for (const category of categories) {
    for (const upgrade of category.upgrades) levels[upgrade.name] = upgrade.quantity
  }
  return levels
}

const allUnlockedGroups = () => {
  const unlocked = {}
  for (const [categoryId, groups] of Object.entries(WORKSHOP_UNLOCK_GROUPS)) {
    for (const group of groups) unlocked[unlockGroupKey(categoryId, group.name)] = true
  }
  return unlocked
}

test.beforeEach(async ({ page }) => {
  // Every Workshop upgrade-unlock group already purchased (OQ-5) -- these
  // tests are about ranking/buying itself, not the unlock gate (see
  // e2e/workshop-inputs.spec.js for a dedicated OQ-5 test).
  await page.addInitScript((unlocked) => {
    window.localStorage.setItem('workshopUnlockedGroups', JSON.stringify(unlocked))
  }, allUnlockedGroups())
  await page.goto('/')
})

test('shows the cheapest not-yet-maxed upgrade first, batched (OQ-7)', async ({ page }) => {
  await page.getByRole('tab', { name: 'Path', exact: true }).click()

  const list = page.getByRole('list', { name: 'Recommended buy order' })
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
  const list = page.getByRole('list', { name: 'Recommended buy order' })
  const row = list.getByText('Attack Speed', { exact: true }).first().locator('xpath=..')
  await expect(row).toContainText('Lv 1 → 11')
})

test('lets a cheap upgrade appear more than once (OQ-19)', async ({ page }) => {
  await page.getByRole('tab', { name: 'Path', exact: true }).click()

  const list = page.getByRole('list', { name: 'Recommended buy order' })
  const rows = list.getByText('Critical Factor', { exact: true })

  await expect(rows).toHaveCount(2)
  await expect(rows.nth(0).locator('xpath=..')).toContainText('Lv 0 → 10')
  await expect(rows.nth(1).locator('xpath=..')).toContainText('Lv 10 → 20')
})

test('buying a row updates the entered level and the Upgrade screen (OQ-18)', async ({
  page,
}) => {
  await page.getByRole('tab', { name: 'Path', exact: true }).click()

  const list = page.getByRole('list', { name: 'Recommended buy order' })
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

  const list = page.getByRole('list', { name: 'Recommended buy order' })
  const rows = list.getByText('Multishot Targets', { exact: true })
  await expect(rows).toHaveCount(4)

  const secondRow = rows.nth(1).locator('xpath=..')
  await secondRow.getByRole('button', { name: /^Buy/ }).click()

  const dialog = page.getByRole('alertdialog')
  await expect(dialog).toContainText(
    'Buy all Multishot Targets upgrades to reach Lv 2 (2.45k coins)?',
  )

  await dialog.getByRole('button', { name: 'Buy all' }).click()
  await expect(dialog).not.toBeVisible()

  await page.getByRole('tab', { name: 'Input', exact: true }).click()
  await expect(page.getByLabel('Multishot Targets', { exact: true })).toHaveValue('2')
})

test('shows and buys an Enhancement row as "{name} +", the game\'s own convention (OQ-29)', async ({
  page,
}) => {
  // Every Workshop upgrade maxed, every Enhancement maxed except one, so
  // that lone Enhancement is unambiguously the only, first row.
  const workshopLevels = maxedLevels(WORKSHOP_CATEGORIES)
  const enhancementLevels = maxedLevels(ENHANCEMENT_CATEGORIES)
  delete enhancementLevels['Recovery Package']

  await page.addInitScript(
    ([workshop, enhancement]) => {
      window.localStorage.setItem('workshopLevels', JSON.stringify(workshop))
      window.localStorage.setItem('enhancementLevels', JSON.stringify(enhancement))
      // Lab already bought -- this test is about ranking Enhancements
      // themselves, not the Lab gate (see OQ-31).
      window.localStorage.setItem('enhancementLabLevel', JSON.stringify(1))
    },
    [workshopLevels, enhancementLevels],
  )
  await page.goto('/')

  await page.getByRole('tab', { name: 'Path', exact: true }).click()

  const list = page.getByRole('list', { name: 'Recommended buy order' })
  const firstRow = list.getByRole('listitem').first()
  await expect(firstRow).toContainText('Recovery Package +')
  await expect(firstRow).toContainText('5B coins')

  await firstRow
    .getByRole('button', { name: 'Buy 1 level of Recovery Package + for 5B coins' })
    .click()

  await page.getByRole('tab', { name: 'Input', exact: true }).click()
  await page.getByRole('tab', { name: 'Enhance', exact: true }).click()
  await page.getByRole('tab', { name: 'Utility', exact: true }).click()
  await expect(page.getByLabel('Recovery Package +', { exact: true })).toHaveValue('1')
})

test('shows the Workshop Enhancements Lab while locked, buying it unlocks Enhancements (OQ-31)', async ({
  page,
}) => {
  // Workshop maxed out so the Lab (locked by default) is the only thing
  // left to show at all.
  await page.addInitScript((workshop) => {
    window.localStorage.setItem('workshopLevels', JSON.stringify(workshop))
  }, maxedLevels(WORKSHOP_CATEGORIES))
  await page.goto('/')

  await page.getByRole('tab', { name: 'Path', exact: true }).click()

  const list = page.getByRole('list', { name: 'Recommended buy order' })
  await expect(list.getByRole('listitem')).toHaveCount(1)
  const labRow = list.getByRole('listitem').first()
  await expect(labRow).toContainText('Workshop Enhancements Lab')
  await expect(labRow).toContainText('5B coins')

  await labRow
    .getByRole('button', { name: 'Buy 1 level of Workshop Enhancements Lab for 5B coins' })
    .click()

  await expect(page.getByText('Workshop Enhancements Lab')).not.toBeVisible()
  // Real Enhancement categories are reachable now -- every row here should
  // be one, shown as "{name} +".
  const firstRow = list.getByRole('listitem').first()
  await expect(firstRow).toContainText('+')
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
