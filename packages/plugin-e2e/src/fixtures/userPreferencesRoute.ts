import { Route } from '@playwright/test';

import { UserPreferences } from '../types';
import { isTeardownError, summarizeError } from '../utils/routeErrors';

/**
 * Merges the user preferences option into the k8s merged preferences API response.
 */
export async function handleMergedPreferencesRoute(route: Route, userPreferences: UserPreferences) {
  try {
    const response = await route.fetch();
    if (!response.ok()) {
      await route.fulfill({ response });
      return;
    }

    const json = await response.json();
    json.spec = { ...json.spec, ...userPreferences };
    await route.fulfill({ response, json });
  } catch (error) {
    // teardown-time errors - route/response are no longer usable, nothing to do
    if (isTeardownError(error)) {
      return;
    }
    console.error(`@grafana/plugin-e2e: Failed to intercept merged preferences: ${summarizeError(error)}`);
    try {
      await route.continue();
    } catch {
      // ignore errors when continuing after a previous failure
    }
  }
}
