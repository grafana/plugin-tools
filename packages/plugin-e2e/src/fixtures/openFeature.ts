import { Page, Route } from '@playwright/test';

import { FeatureFlagValue, PlaywrightArgs } from '../types';

/**
 * Represents a single flag in the OFREP response
 */
interface OFREPFlag {
  key: string;
  value: FeatureFlagValue;
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
 * Handles the OFREP bulk evaluation endpoint by merging flags into the response
 */
async function handleBulkEvaluationRoute(
  route: Route,
  flags: Record<string, FeatureFlagValue>,
  latency: number
): Promise<void> {
  let response: Awaited<ReturnType<Route['fetch']>> | undefined;

  try {
    response = await route.fetch();

    if (!response.ok()) {
      await route.fulfill({ response });
      return;
    }

    const body: OFREPBulkResponse = await response.json();

    // override existing flags with provided values
    for (const flag of body.flags) {
      if (flag.key in flags) {
        flag.value = flags[flag.key];
        flag.reason = 'STATIC';
        flag.variant = 'playwright-override';
      }
    }

    // add any flags not present in the original response
    for (const [key, value] of Object.entries(flags)) {
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
    // fulfill with original response if available, otherwise return error response
    if (response) {
      await route.fulfill({ response });
    } else {
      await route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Failed to intercept OFREP request' }),
        headers: { 'content-type': 'application/json' },
      });
    }
  }
}

/**
 * Handles the OFREP single flag evaluation endpoint by returning the override if defined
 */
async function handleSingleFlagRoute(
  route: Route,
  flags: Record<string, FeatureFlagValue>,
  latency: number
): Promise<void> {
  try {
    const url = new URL(route.request().url());
    const flagKey = url.pathname.split('/').pop();

    if (flagKey && flagKey in flags) {
      // apply artificial latency if specified
      if (latency > 0) {
        await delay(latency);
      }

      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          key: flagKey,
          value: flags[flagKey],
          reason: 'STATIC',
          variant: 'playwright-override',
        }),
        headers: { 'content-type': 'application/json' },
      });
      return;
    }

    // fetch the original response if we don't have an override
    const response = await route.fetch();
    await route.fulfill({ response });
  } catch (error) {
    console.error('@grafana/plugin-e2e: Failed to intercept OFREP single flag evaluation', error);
    // return error response since we can't continue after route.fetch()
    await route.fulfill({
      status: 500,
      body: JSON.stringify({ error: 'Failed to intercept OFREP request' }),
      headers: { 'content-type': 'application/json' },
    });
  }
}

/**
 * Sets up route interception for OpenFeature OFREP endpoints
 */
export async function setupOpenFeatureRoutes(
  page: Page,
  openFeature: Record<string, FeatureFlagValue>,
  latency: number,
  selectors: PlaywrightArgs['selectors']
): Promise<void> {
  // intercept bulk evaluation endpoint
  await page.route(selectors.apis.OpenFeature.ofrepBulkPattern, async (route) => {
    await handleBulkEvaluationRoute(route, openFeature, latency);
  });

  // intercept single flag evaluation endpoint
  await page.route(selectors.apis.OpenFeature.ofrepSinglePattern, async (route) => {
    await handleSingleFlagRoute(route, openFeature, latency);
  });
}
