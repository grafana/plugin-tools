import { Page, TestFixture } from '@playwright/test';

import { PlaywrightArgs } from '../types';
import { overrideGrafanaBootData } from './scripts/overrideGrafanaBootData';

type PageFixture = TestFixture<Page, PlaywrightArgs>;

/**
 * This fixture ensures the feature toggles defined in the Playwright config are being used in Grafana frontend.
 * If Grafana version >= 10.1.0, feature toggles are read from to the 'grafana.featureToggles' key in the browser's localStorage.
 * Otherwise, feature toggles are added directly to the window.grafanaBootData.settings.featureToggles object.
 *
 * page.addInitScript adds a script which would be evaluated in one of the following scenarios:
 * - Whenever the page is navigated.
 * - Whenever the child frame is attached or navigated. In this case, the script is evaluated in the context of the
 *   newly attached frame.
 * The script is evaluated after the document was created but before any of its scripts were run.
 */
export const page: PageFixture = async ({ page, featureToggles, userPreferences }, use) => {
  if (Object.keys(featureToggles).length > 0 || Object.keys(userPreferences).length > 0) {
    try {
      await page.addInitScript(overrideGrafanaBootData, { featureToggles, userPreferences });
    } catch (error) {
      console.error('Failed to set feature toggles', error);
    }
  }

  await page.goto('/');
  await use(page);
};
