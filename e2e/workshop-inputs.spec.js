import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

const unlockGroups = (page, keys) =>
  page.addInitScript((ks) => {
    const unlocked = Object.fromEntries(ks.map((k) => [k, true]))
    window.localStorage.setItem('workshopUnlockedGroups', JSON.stringify(unlocked))
  }, keys)

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
  // Thorns belongs to Defense's paid "Thorn Upgrades" unlock group, the 2nd
  // in Defense's sequence -- groups unlock in order (OQ-5), so "Defense
  // Upgrades" (the 1st) must be unlocked too before Thorns is reachable.
  await unlockGroups(page, ['defense:Defense Upgrades', 'defense:Thorn Upgrades'])
  await page.goto('/')
  await page.getByRole('tab', { name: 'Defense', exact: true }).click()

  const thornsInput = page.getByLabel('Thorns', { exact: true })
  await thornsInput.fill('9999')
  await thornsInput.blur()

  await expect(thornsInput).toHaveValue('99')
})

test('shows the first locked group as an inline Unlock button, and buying it reveals its inputs (OQ-5)', async ({
  page,
}) => {
  await page.getByRole('tab', { name: 'Defense', exact: true }).click()

  await expect(page.getByLabel('Defense Percent', { exact: true })).not.toBeVisible()
  await expect(page.getByText('Defense Percent', { exact: true })).toBeVisible()
  // "Defense Upgrades" gates two upgrades (Defense Percent and Defense
  // Absolute), so its Unlock button appears once per row -- either buys the
  // same group.
  const unlockButton = page
    .getByRole('button', { name: 'Unlock "Defense Upgrades" (75 coins)' })
    .first()
  await expect(unlockButton).toBeVisible()

  await unlockButton.click()

  await expect(page.getByLabel('Defense Percent', { exact: true })).toBeVisible()
  await expect(page.getByLabel('Defense Absolute', { exact: true })).toBeVisible()
  await expect(unlockButton).not.toBeVisible()

  await page.reload()
  await page.getByRole('tab', { name: 'Defense', exact: true }).click()
  await expect(page.getByLabel('Defense Percent', { exact: true })).toBeVisible()
})

test("blocks a later group's upgrades until every earlier group in the tree is bought first (OQ-5)", async ({
  page,
}) => {
  await page.getByRole('tab', { name: 'Defense', exact: true }).click()

  // Thorns (2nd paid group) shows a blocked note, not an Unlock button --
  // "Defense Upgrades" (1st) hasn't been bought yet.
  await expect(page.getByLabel('Thorns', { exact: true })).not.toBeVisible()
  await expect(page.getByText('Thorns', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: /Thorn Upgrades/ })).not.toBeVisible()
  // Every later-group upgrade in the tree (not just Thorns) shows the same
  // blocked note, since they're all waiting on the same next group.
  await expect(
    page.getByText('Locked until "Defense Upgrades" is unlocked').first(),
  ).toBeVisible()

  await page
    .getByRole('button', { name: 'Unlock "Defense Upgrades" (75 coins)' })
    .first()
    .click()

  // Now Thorns is next -- its own Unlock button appears.
  await expect(page.getByRole('button', { name: 'Unlock "Thorn Upgrades" (500 coins)' })).toBeVisible()
  await expect(page.getByLabel('Thorns', { exact: true })).not.toBeVisible()
})
