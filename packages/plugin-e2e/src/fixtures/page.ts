import { Page, TestFixture } from '@playwright/test';
import { gte } from 'semver';

import { PlaywrightArgs } from '../types';
import { DEFAULT_OPEN_FEATURE_FLAGS } from '../options';
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
 * The `featureToggles` option uses both approaches: the legacy init script (all versions) and OFREP
 * interception (Grafana 12.1.0+). The dual injection prevents the server's OFREP bulk-evaluation
 * response from overriding the bootData values after the app loads.
 * The `openFeature` option uses OFREP API interception only and requires Grafana >= 12.1.0.
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
  const hasUserPreferences = Object.keys(userPreferences).length > 0;

  // Merge featureToggles into OFREP flags so that Grafana 12.1.0+ runtime OFREP
  // evaluation reflects the same values as the bootData override. Without this,
  // the server's OFREP bulk-evaluation response can override bootData values (e.g.
  // tlsEnabled, alertingQueryAndExpressionsStepMode) after the app has loaded.
  // openFeature.flags takes highest precedence; DEFAULT_OPEN_FEATURE_FLAGS is baseline.
  const mergedFlags = { ...DEFAULT_OPEN_FEATURE_FLAGS, ...featureToggles, ...openFeature.flags };
  const hasOFREPFlags = Object.keys(mergedFlags).length > 0;

  // set up legacy feature toggle overrides via init script
  if (hasFeatureToggles || hasUserPreferences) {
    try {
      await page.addInitScript(overrideGrafanaBootData, { featureToggles, userPreferences });
    } catch (error) {
      console.error('Failed to set feature toggles', error);
    }
  }

  // set up OpenFeature OFREP route interception BEFORE navigation
  // only runs if there are flags to inject and Grafana version >= 12.1.0
  if (hasOFREPFlags && gte(grafanaVersion, '12.1.0')) {
    await setupOpenFeatureRoutes(page, mergedFlags, openFeature.latency ?? 0, selectors);
  }

  await page.goto('/');
  await use(page);
};
