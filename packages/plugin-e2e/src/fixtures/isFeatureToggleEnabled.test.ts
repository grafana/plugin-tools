import type { Page } from '@playwright/test';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

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
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

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

  it('returns false instead of throwing when boot data never arrives', async () => {
    const page = createMockPage({ timesOut: true });
    await expect(isLegacyFeatureEnabled(page, 'dashboardNewLayouts')).resolves.toBe(false);
    expect(console.error).toHaveBeenCalled();
  });
});
