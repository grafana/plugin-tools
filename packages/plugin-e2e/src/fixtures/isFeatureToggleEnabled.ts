import { Page, TestFixture } from '@playwright/test';
import { PlaywrightArgs } from '../types';

type FeatureToggleFixture = TestFixture<<T = object>(featureToggle: keyof T) => Promise<boolean>, PlaywrightArgs>;

const FEATURE_TOGGLES_TIMEOUT = 5000;

/**
 * Reads the feature toggle map from boot data, waiting for it to arrive.
 *
 * Grafana can render the app shell before it has merged its boot data, in which case
 * `settings.featureToggles` is briefly absent even though the Window type declares it as always
 * present. Reading it once then throws `Cannot read properties of undefined`. Falling back to an
 * empty map without waiting is worse than throwing, because a missing map is indistinguishable
 * from every toggle being disabled, so a caller silently takes its legacy branch on an instance
 * where the toggle is enabled.
 */
const readFeatureToggles = async <T>(page: Page): Promise<T> => {
  try {
    const featureToggles = await page.waitForFunction(
      () => window.grafanaBootData?.settings?.featureToggles ?? null,
      undefined,
      { timeout: FEATURE_TOGGLES_TIMEOUT }
    );
    return (await featureToggles.jsonValue()) as T;
  } catch (error) {
    console.error('@grafana/plugin-e2e: Failed to read feature toggles from boot data', error);
    return {} as T;
  }
};

export const isLegacyFeatureToggleEnabled: FeatureToggleFixture = async ({ page }, use) => {
  await use(async <T = object>(featureToggle: keyof T) => {
    const featureToggles = await readFeatureToggles<T>(page);
    return Boolean(featureToggles[featureToggle]);
  });
};

export const isFeatureToggleEnabled: FeatureToggleFixture = isLegacyFeatureToggleEnabled;

export const isLegacyFeatureEnabled = async (page: Page, featureToggle: string) => {
  const featureToggles = await readFeatureToggles<Record<string, boolean>>(page);
  return Boolean(featureToggles[featureToggle]);
};

export const isFeatureEnabled = isLegacyFeatureEnabled;
