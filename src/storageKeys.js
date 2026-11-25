/**
 * Every `localStorage` key the app uses, named once (OQ-141/AC-1). Each is
 * either tower data -- what a share link carries -- or an interface
 * setting, which a link does not. A new key has to be classified here;
 * storageKeys.test.js fails if a key literal appears anywhere else in src/.
 */
export const TOWER_DATA_KEYS = {
  workshopLevels: 'workshopLevels',
  enhancementLevels: 'enhancementLevels',
  workshopDiscountLabs: 'workshopDiscountLabs',
  enhancementDiscountLabs: 'enhancementDiscountLabs',
  enhancementLabLevel: 'enhancementLabLevel',
  workshopUnlockedGroups: 'workshopUnlockedGroups',
  buyOutLifetimeCoins: 'buyOutLifetimeCoins',
  buyOutLabCoinsSpent: 'buyOutLabCoinsSpent',
}

export const INTERFACE_SETTING_KEYS = {
  appSection: 'appSection',
  pathView: 'pathView',
  workshopMode: 'workshopMode',
  activeCategoryId: 'activeCategoryId',
  themePreference: 'themePreference',
}

export const STORAGE_KEYS = { ...TOWER_DATA_KEYS, ...INTERFACE_SETTING_KEYS }
