import { APIResponse, Route } from '@playwright/test';

import { UserPreferences } from '../types';
import { isTeardownError, summarizeError } from '../utils/routeErrors';

/**
 * Merges the user preferences option into the k8s merged preferences API response.
 */
export async function handleMergedPreferencesRoute(route: Route, userPreferences: UserPreferences) {
  let response: APIResponse | undefined;

  try {
    response = await route.fetch();
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
      if (response) {
        await route.fulfill({ response });
      } else {
        await route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Failed to intercept merged preferences request' }),
          headers: { 'content-type': 'application/json' },
        });
      }
    } catch {
      // ignore errors when fulfilling after a previous failure
    }
  }
}
