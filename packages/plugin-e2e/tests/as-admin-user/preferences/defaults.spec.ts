import * as semver from 'semver';

import { expect, test } from '../../../src';

test.use({
  featureToggles: {
    localizationForPlugins: true,
  },
});

test.describe('default user preferences', () => {
  test('should use English language on profile page', async ({ grafanaVersion, page }) => {
    test.skip(semver.lt(grafanaVersion, '11.0.0'), 'User preferences are only supported in Grafana 11 and later');
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: 'Profile' })).toBeVisible({ timeout: 10_000 });
  });

  test('should use dark theme', async ({ page, grafanaVersion }) => {
    test.skip(semver.lt(grafanaVersion, '11.0.0'), 'User preferences are only supported in Grafana 11 and later');
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const header = page.getByRole('banner');
    await expect(header).toHaveCSS('background-color', 'rgb(24, 27, 31)', { timeout: 10_000 });
  });
});
