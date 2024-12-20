import { Page, TestFixture } from '@playwright/test';
import { PlaywrightArgs } from '../types';

type FeatureToggleFixture = TestFixture<<T = object>(featureToggle: keyof T) => Promise<boolean>, PlaywrightArgs>;

export const isFeatureToggleEnabled: FeatureToggleFixture = async ({ page }, use) => {
  await use(async <T = object>(featureToggle: keyof T) => {
    const featureToggles: T = await page.evaluate('window.grafanaBootData.settings.featureToggles');
    return Boolean(featureToggles[featureToggle]);
  });
};

export const isFeatureEnabled = async (page: Page, featureToggle: string) => {
  const featureToggles: Record<string, string> = await page.evaluate('window.grafanaBootData.settings.featureToggles');
  return Boolean(featureToggles[featureToggle]);
};
