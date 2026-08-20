import type { Page } from '@playwright/test';
import { describe, it, expect, vi } from 'vitest';

import { isLegacyFeatureEnabled } from './isFeatureToggleEnabled';

/**
 * Stands in for a Playwright Page. waitForFunction resolves with a handle whose jsonValue()
 * returns the toggle map, or rejects to simulate the timeout.
 */
function createMockPage(behaviour: { toggles?: Record<string, boolean>; timesOut?: boolean }) {
  return {
    waitForFunction: vi.fn().mockImplementation(() => {
      if (behaviour.timesOut) {
        return Promise.reject(new Error('Timeout 5000ms exceeded'));
      }
      return Promise.resolve({ jsonValue: () => Promise.resolve(behaviour.toggles) });
    }),
  } as unknown as Page;
}

describe('isLegacyFeatureEnabled', () => {
  it('returns true for an enabled toggle', async () => {
    const page = createMockPage({ toggles: { dashboardNewLayouts: true } });
    await expect(isLegacyFeatureEnabled(page, 'dashboardNewLayouts')).resolves.toBe(true);
  });

  it('returns false for a toggle that is absent from the map', async () => {
    const page = createMockPage({ toggles: { somethingElse: true } });
    await expect(isLegacyFeatureEnabled(page, 'dashboardNewLayouts')).resolves.toBe(false);
  });

  it('waits for the toggle map rather than reading it once', async () => {
    const page = createMockPage({ toggles: { dashboardNewLayouts: true } });
    await isLegacyFeatureEnabled(page, 'dashboardNewLayouts');
    expect(page.waitForFunction).toHaveBeenCalledTimes(1);
  });

  // Falling back to an empty map here would be indistinguishable from every toggle being
  // disabled, so callers would silently take a legacy branch on an instance where the toggle is
  // on. The timeout must stay loud.
  it('rethrows when boot data never arrives rather than reporting every toggle as disabled', async () => {
    const page = createMockPage({ timesOut: true });
    await expect(isLegacyFeatureEnabled(page, 'dashboardNewLayouts')).rejects.toThrow(
      /featureToggles was not available within 5000ms/
    );
  });

  it('preserves the underlying timeout as the error cause', async () => {
    const page = createMockPage({ timesOut: true });
    const error = await isLegacyFeatureEnabled(page, 'dashboardNewLayouts').catch((e: unknown) => e);
    expect((error as Error).cause).toEqual(new Error('Timeout 5000ms exceeded'));
  });
});
