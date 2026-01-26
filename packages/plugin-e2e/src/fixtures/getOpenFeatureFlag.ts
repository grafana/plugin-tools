import { TestFixture } from '@playwright/test';
import { PlaywrightArgs } from '../types';

type GetBooleanOpenFeatureFlagFixture = TestFixture<(flagKey: string) => Promise<boolean>, PlaywrightArgs>;

export const getBooleanOpenFeatureFlag: GetBooleanOpenFeatureFlagFixture = async (
  { page, selectors, namespace },
  use
) => {
  await use(async (flagKey: string) => {
    try {
      const url = selectors.apis.OpenFeature.ofrepSinglePath(namespace, flagKey);
      const response = await page.request.get(url);

      if (!response.ok()) {
        throw new Error(`Failed to fetch OpenFeature flag "${flagKey}": ${response.status()} ${response.statusText()}`);
      }

      const body = await response.json();
      const value = body.value;

      if (typeof value !== 'boolean') {
        throw new Error(
          `Expected boolean value for flag "${flagKey}", but got ${typeof value}. Use a different getter for non-boolean flags.`
        );
      }

      return value;
    } catch (error) {
      console.error(`@grafana/plugin-e2e: Failed to get OpenFeature flag "${flagKey}"`, error);
      throw error;
    }
  });
};
