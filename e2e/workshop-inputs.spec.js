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

const storedDamage = (page) =>
  page.evaluate(() => JSON.parse(window.localStorage.getItem('workshopLevels') ?? '{}').Damage)

test('OQ-97/AC-1: clicking into a level input selects it, so the next digit replaces it', async ({ page }) => {
  const damageInput = page.getByLabel('Damage', { exact: true })
  await damageInput.fill('123')
  await damageInput.blur()

  await damageInput.click()
  await page.keyboard.type('7')

  expect(await damageInput.inputValue()).toBe('7')
  expect(await storedDamage(page)).toBe(7)
})

test('OQ-97/AC-2: typing after an existing 0 shows no leading zero', async ({ page }) => {
  const damageInput = page.getByLabel('Damage', { exact: true })
  await damageInput.focus()
  await page.keyboard.press('End')
  await page.keyboard.type('5')

  expect(await damageInput.inputValue()).toBe('5')
  expect(await storedDamage(page)).toBe(5)

  await damageInput.blur()
  expect(await damageInput.inputValue()).toBe('5')
})

test('OQ-97/AC-3: an emptied input shows blank and stores 0, and shows 0 once it loses focus', async ({ page }) => {
  const damageInput = page.getByLabel('Damage', { exact: true })
  await damageInput.fill('42')
  await damageInput.blur()
  await damageInput.click()
  await page.keyboard.press('Backspace')

  expect(await damageInput.inputValue()).toBe('')
  expect(await storedDamage(page)).toBe(0)

  await damageInput.blur()
  expect(await damageInput.inputValue()).toBe('0')
  expect(await storedDamage(page)).toBe(0)
})

test('OQ-97/AC-4: a value above the max is clamped, both stored and shown', async ({ page }) => {
  const damageInput = page.getByLabel('Damage', { exact: true })
  await damageInput.click()
  await page.keyboard.type('7000')

  expect(await damageInput.inputValue()).toBe('6000')
  expect(await storedDamage(page)).toBe(6000)
})

test('hides every locked upgrade and shows a single Unlock button for the next group, revealing its inputs once bought (OQ-5)', async ({
  page,
}) => {
  await page.getByRole('tab', { name: 'Defense', exact: true }).click()

  // Every upgrade behind a not-yet-purchased group is hidden entirely --
  // not shown as a locked row -- so only one Unlock button appears for the
  // whole tree, for "Defense Upgrades" (the 1st paid group).
  await expect(page.getByLabel('Defense Percent', { exact: true })).not.toBeVisible()
  await expect(page.getByText('Defense Percent', { exact: true })).not.toBeVisible()
  await expect(page.getByLabel('Thorns', { exact: true })).not.toBeVisible()
  await expect(page.getByText('Thorns', { exact: true })).not.toBeVisible()
  const unlockButton = page.getByRole('button', { name: 'Unlock "Defense Upgrades" (75 coins)' })
  await expect(unlockButton).toBeVisible()
  await expect(page.getByRole('button', { name: /^Unlock/ })).toHaveCount(1)

  await unlockButton.click()

  await expect(page.getByLabel('Defense Percent', { exact: true })).toBeVisible()
  await expect(page.getByLabel('Defense Absolute', { exact: true })).toBeVisible()
  await expect(unlockButton).not.toBeVisible()

  // Thorns (2nd paid group) is still hidden, but now behind its own Unlock
  // button rather than "Defense Upgrades"'s.
  await expect(page.getByLabel('Thorns', { exact: true })).not.toBeVisible()
  await expect(page.getByText('Thorns', { exact: true })).not.toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Unlock "Thorn Upgrades" (500 coins)' }),
  ).toBeVisible()

  await page.reload()
  await page.getByRole('tab', { name: 'Defense', exact: true }).click()
  await expect(page.getByLabel('Defense Percent', { exact: true })).toBeVisible()
})
