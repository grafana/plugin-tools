import * as semver from 'semver';

import { expect, test } from '../../../src';

test.use({
  featureToggles: {
    localizationForPlugins: true,
  },
  userPreferences: {
    language: 'es-ES',
    theme: 'light',
  },
});

test.describe('override user preferences', () => {
  test('should use Spanish language on profile page', async ({ page, grafanaVersion }) => {
    test.skip(semver.lt(grafanaVersion, '11.0.0'), 'User preferences are only supported in Grafana 11 and later');
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: 'Perfil' })).toBeVisible({ timeout: 10_000 });
  });

  test('should use light theme', async ({ page, grafanaVersion }) => {
    test.skip(semver.lt(grafanaVersion, '11.0.0'), 'User preferences are only supported in Grafana 11 and later');
    await page.goto('/');
    const header = page.getByRole('banner');
    await expect(header).toBeVisible({ timeout: 10_000 });
    await expect(header).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  });
});
