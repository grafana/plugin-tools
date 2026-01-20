import { Page, Route, TestFixture } from '@playwright/test';

import { PlaywrightArgs } from '../types';
import { overrideGrafanaBootData } from './scripts/overrideGrafanaBootData';

type PageFixture = TestFixture<Page, PlaywrightArgs>;

/** OFREP bulk evaluation endpoint pattern */
const OFREP_BULK_PATTERN = '**/apis/features.grafana.app/**/ofrep/v1/evaluate/flags';

/** OFREP single flag evaluation endpoint pattern */
const OFREP_SINGLE_PATTERN = '**/apis/features.grafana.app/**/ofrep/v1/evaluate/flags/*';

/**
 * Represents a single flag in the OFREP response
 */
interface OFREPFlag {
  key: string;
  value: boolean;
  reason: string;
  variant: string;
}

/**
 * Represents the OFREP bulk evaluation response body
 */
interface OFREPBulkResponse {
  flags: OFREPFlag[];
}

/**
 * Delays execution for the specified number of milliseconds
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Handles the OFREP bulk evaluation endpoint by merging featureToggles into the response
 */
async function handleBulkEvaluationRoute(
  route: Route,
  featureToggles: Record<string, boolean>,
  latency: number
): Promise<void> {
  try {
    const response = await route.fetch();

    if (!response.ok()) {
      await route.fulfill({ response });
      return;
    }

    const body: OFREPBulkResponse = await response.json();

    // Override existing flags with featureToggles values
    for (const flag of body.flags) {
      if (flag.key in featureToggles) {
        flag.value = featureToggles[flag.key];
        flag.reason = 'STATIC';
        flag.variant = 'playwright-override';
      }
    }

    // Add any featureToggles not present in the original response
    for (const [key, value] of Object.entries(featureToggles)) {
      const exists = body.flags.some((f) => f.key === key);
      if (!exists) {
        body.flags.push({
          key,
          value,
          reason: 'STATIC',
          variant: 'playwright-override',
        });
      }
    }

    // Apply artificial latency if specified
    if (latency > 0) {
      await delay(latency);
    }

    await route.fulfill({
      response,
      body: JSON.stringify(body),
      headers: { 'content-type': 'application/json' },
    });
  } catch (error) {
    console.error('@grafana/plugin-e2e: Failed to intercept OFREP bulk evaluation', error);
    await route.continue();
  }
}

/**
 * Handles the OFREP single flag evaluation endpoint by returning the override if defined
 */
async function handleSingleFlagRoute(
  route: Route,
  featureToggles: Record<string, boolean>,
  latency: number
): Promise<void> {
  try {
    const url = new URL(route.request().url());
    const flagKey = url.pathname.split('/').pop();

    if (flagKey && flagKey in featureToggles) {
      // Apply artificial latency if specified
      if (latency > 0) {
        await delay(latency);
      }

      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          key: flagKey,
          value: featureToggles[flagKey],
          reason: 'STATIC',
          variant: 'playwright-override',
        }),
        headers: { 'content-type': 'application/json' },
      });
      return;
    }

    await route.continue();
  } catch (error) {
    console.error('@grafana/plugin-e2e: Failed to intercept OFREP single flag evaluation', error);
    await route.continue();
  }
}

/**
 * Sets up route interception for OpenFeature OFREP endpoints using featureToggles
 */
async function setupOpenFeatureRoutes(
  page: Page,
  featureToggles: Record<string, boolean>,
  latency: number
): Promise<void> {
  console.log('@grafana/plugin-e2e: setting up OpenFeature OFREP interception', { featureToggles, latency });

  // Intercept bulk evaluation endpoint
  await page.route(OFREP_BULK_PATTERN, async (route) => {
    await handleBulkEvaluationRoute(route, featureToggles, latency);
  });

  // Intercept single flag evaluation endpoint
  await page.route(OFREP_SINGLE_PATTERN, async (route) => {
    await handleSingleFlagRoute(route, featureToggles, latency);
  });
}

/**
 * This fixture ensures the feature toggles defined in the Playwright config are being used in Grafana frontend.
 *
 * Feature toggles are applied in two ways:
 * 1. Legacy: Added directly to the window.grafanaBootData.settings.featureToggles object via init script
 * 2. OpenFeature: Intercepted and merged into OFREP API responses
 *
 * This dual approach ensures feature toggles work regardless of whether Grafana is using legacy toggles
 * or the newer OpenFeature system.
 *
 * page.addInitScript adds a script which would be evaluated in one of the following scenarios:
 * - Whenever the page is navigated.
 * - Whenever the child frame is attached or navigated. In this case, the script is evaluated in the context of the
 *   newly attached frame.
 * The script is evaluated after the document was created but before any of its scripts were run.
 */
export const page: PageFixture = async ({ page, featureToggles, userPreferences, openFeatureLatency }, use) => {
  const hasFeatureToggles = Object.keys(featureToggles).length > 0;
  const hasUserPreferences = Object.keys(userPreferences).length > 0;

  // Set up legacy feature toggle overrides via init script
  if (hasFeatureToggles || hasUserPreferences) {
    try {
      await page.addInitScript(overrideGrafanaBootData, { featureToggles, userPreferences });
    } catch (error) {
      console.error('Failed to set feature toggles', error);
    }
  }

  // Set up OpenFeature OFREP route interception BEFORE navigation
  // This ensures featureToggles also work for OpenFeature-based flags
  if (hasFeatureToggles) {
    await setupOpenFeatureRoutes(page, featureToggles, openFeatureLatency);
  }

  await page.goto('/');
  await use(page);
};
