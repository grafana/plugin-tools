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

      // make the request from within the page context to use the same authentication
      const result = await page.evaluate(async (flagUrl) => {
        const response = await fetch(flagUrl);

        if (!response.ok) {
          return {
            error: true,
            status: response.status,
            statusText: response.statusText,
          };
        }

        const body = await response.json();
        return { error: false, value: body.value };
      }, url);

      if (result.error) {
        throw new Error(`Failed to fetch OpenFeature flag "${flagKey}": ${result.status} ${result.statusText}`);
      }

      const value = result.value;

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
