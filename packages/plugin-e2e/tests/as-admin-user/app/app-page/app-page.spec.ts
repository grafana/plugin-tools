import { AppPage, expect, test } from '../../../../src';

test('should navigate to app root page when calling goto without any path', async ({
  grafanaVersion,
  selectors,
  page,
  request,
}, testInfo) => {
  const appPage = new AppPage({ grafanaVersion, selectors, page, request, testInfo }, { pluginId: 'redis-app' });
  await appPage.goto();

  await expect(page).toHaveURL(/.*\/a\/redis-app$/);
});

test('should navigate to app sub page when calling goto with path', async ({
  grafanaVersion,
  selectors,
  page,
  request,
}, testInfo) => {
  const appPage = new AppPage({ grafanaVersion, selectors, page, request, testInfo }, { pluginId: 'redis-app' });
  await appPage.goto({ path: '/create' });

  await expect(page).toHaveURL(/.*\/a\/redis-app\/create$/);
});
