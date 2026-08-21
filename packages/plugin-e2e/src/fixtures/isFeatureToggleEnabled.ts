import { Page, TestFixture } from '@playwright/test';
import { PlaywrightArgs } from '../types';

type FeatureToggleFixture = TestFixture<<T = object>(featureToggle: keyof T) => Promise<boolean>, PlaywrightArgs>;

const FEATURE_TOGGLES_TIMEOUT = 5000;

/**
 * Reads the feature toggle map from boot data, waiting for it to arrive.
 *
 * Grafana can render the app shell before it has merged its boot data, in which case
 * `settings.featureToggles` is briefly absent even though the Window type declares it as always
 * present. Reading it once then throws `Cannot read properties of undefined`.
 *
 * Waiting removes that race. It deliberately does not fall back to an empty map when the wait
 * times out, because a missing map is indistinguishable from every toggle being disabled: a
 * caller would silently take its legacy branch on an instance where the toggle is enabled. A
 * loud failure is the lesser evil, so the timeout is rethrown with the context needed to act
 * on it.
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
    throw new Error(
      `@grafana/plugin-e2e: window.grafanaBootData.settings.featureToggles was not available within ${FEATURE_TOGGLES_TIMEOUT}ms`,
      { cause: error }
    );
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
