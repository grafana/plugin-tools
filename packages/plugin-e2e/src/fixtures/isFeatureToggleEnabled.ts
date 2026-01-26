import { Page, TestFixture } from '@playwright/test';
import { PlaywrightArgs } from '../types';

type FeatureToggleFixture = TestFixture<<T = object>(featureToggle: keyof T) => Promise<boolean>, PlaywrightArgs>;

/**
 * Checks if a legacy feature toggle is enabled.
 * This only checks window.grafanaBootData.settings.featureToggles (legacy system).
 * For OpenFeature flags, use getBooleanOpenFeatureFlag instead.
 */
export const isLegacyFeatureToggleEnabled: FeatureToggleFixture = async ({ page }, use) => {
  await use(async <T = object>(featureToggle: keyof T) => {
    const featureToggles: T = await page.evaluate('window.grafanaBootData.settings.featureToggles');
    return Boolean(featureToggles[featureToggle]);
  });
};

/**
 * @deprecated Use isLegacyFeatureToggleEnabled instead. This fixture only checks legacy feature toggles
 * (window.grafanaBootData.settings.featureToggles). For OpenFeature flags, use getBooleanOpenFeatureFlag.
 */
export const isFeatureToggleEnabled: FeatureToggleFixture = isLegacyFeatureToggleEnabled;

/**
 * Checks if a legacy feature toggle is enabled.
 * This only checks window.grafanaBootData.settings.featureToggles (legacy system).
 * For OpenFeature flags, use getBooleanOpenFeatureFlag instead.
 */
export const isLegacyFeatureEnabled = async (page: Page, featureToggle: string) => {
  const featureToggles: Record<string, string> = await page.evaluate('window.grafanaBootData.settings.featureToggles');
  return Boolean(featureToggles[featureToggle]);
};

/**
 * @deprecated Use isLegacyFeatureEnabled instead. This function only checks legacy feature toggles
 * (window.grafanaBootData.settings.featureToggles). For OpenFeature flags, use getBooleanOpenFeatureFlag.
 */
export const isFeatureEnabled = isLegacyFeatureEnabled;
