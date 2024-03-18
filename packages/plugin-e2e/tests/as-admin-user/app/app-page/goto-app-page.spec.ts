import { expect, test } from '../../../../src';

test('should navigate to app root page when calling goto without any path', async ({ gotoAppPage, page }) => {
  await gotoAppPage({ pluginId: 'redis-app' });
  await expect(page).toHaveURL(/.*\/a\/redis-app$/);
});

test('should navigate to app sub page when calling goto with path', async ({ gotoAppPage, page }) => {
  await gotoAppPage({ pluginId: 'redis-app', path: '/create' });
  await expect(page).toHaveURL(/.*\/a\/redis-app\/create$/);
});
