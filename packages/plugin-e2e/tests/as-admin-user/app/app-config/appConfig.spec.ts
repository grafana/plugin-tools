import { Page } from '@playwright/test';
import { expect, test } from '../../../../src';

test('should navigate, by default, to app config page for provided plugin id when created', async ({
  createAppConfigPage,
  page,
}) => {
  await createAppConfigPage({ pluginId: 'redis-app' });
  expect(pathFromUrl(page)).toBe('/plugins/redis-app');
});

test('should not navigate to app config page for provided plugin id when created', async ({
  createAppConfigPage,
  page,
}) => {
  const configPage = await createAppConfigPage({ pluginId: 'redis-app' }, { goto: false });
  expect(pathFromUrl(page)).toBe('/');
  await configPage.goto();
  expect(pathFromUrl(page)).toBe('/plugins/redis-app');
});

test.only('should wait for plugin config settings API to respond', async ({ createAppConfigPage, page }) => {
  const configPage = await createAppConfigPage({ pluginId: 'redis-app' });
  await page.route(
    '/api/plugins/redis-app/settings',
    async (route) => {
      await route.fulfill({ status: 200 });
    },
    { times: 1 }
  );

  const response = configPage.waitForSettingsResponse();
  page.getByRole('button', { name: 'Disable' }).first().click();
  await expect(response).toBeOK();
});

function pathFromUrl(page: Page): string {
  const url = new URL(page.url());
  return url.pathname;
}
