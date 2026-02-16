import { Page, TestFixture } from '@playwright/test';
import { gte } from 'semver';

import { PlaywrightArgs } from '../types';
import { setupOpenFeatureRoutes } from './openFeature';
import { overrideGrafanaBootData } from './scripts/overrideGrafanaBootData';

type PageFixture = TestFixture<Page, PlaywrightArgs>;

/**
 * This fixture ensures the feature toggles defined in the Playwright config are being used in Grafana frontend.
 *
 * Feature toggles are applied in two ways:
 * 1. Legacy: Added directly to the window.grafanaBootData.settings.featureToggles object via init script
 * 2. OpenFeature: Intercepted and merged into OFREP API responses (Grafana 12.1.0+)
 *
 * The `featureToggles` option uses the legacy approach only.
 * The `openFeature` option uses OFREP API interception and requires Grafana >= 12.1.0.
 *
 * page.addInitScript adds a script which would be evaluated in one of the following scenarios:
 * - Whenever the page is navigated.
 * - Whenever the child frame is attached or navigated. In this case, the script is evaluated in the context of the
 *   newly attached frame.
 * The script is evaluated after the document was created but before any of its scripts were run.
 */
export const page: PageFixture = async (
  { page, featureToggles, openFeature, userPreferences, grafanaVersion, selectors },
  use
) => {
  const hasFeatureToggles = Object.keys(featureToggles).length > 0;
  const hasOpenFeature = Object.keys(openFeature.flags).length > 0;
  const hasUserPreferences = Object.keys(userPreferences).length > 0;

  // set up legacy feature toggle overrides via init script
  if (hasFeatureToggles || hasUserPreferences) {
    try {
      await page.addInitScript(overrideGrafanaBootData, { featureToggles, userPreferences });
    } catch (error) {
      console.error('Failed to set feature toggles', error);
    }
  }

  // set up OpenFeature OFREP route interception BEFORE navigation
  // only runs if openFeature flags are provided and Grafana version >= 12.1.0
  if (hasOpenFeature && gte(grafanaVersion, '12.1.0')) {
    await setupOpenFeatureRoutes(page, openFeature.flags, openFeature.latency ?? 0, openFeature.log ?? true, selectors);
  }

  await page.goto('/');
  await use(page);
};
