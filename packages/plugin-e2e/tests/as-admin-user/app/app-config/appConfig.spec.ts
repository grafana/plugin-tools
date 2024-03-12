import { expect, test } from '../../../../src';

test('should navigate to app config page for provided plugin id when created', async ({
  createAppConfigPage,
  page,
}) => {
  await createAppConfigPage({ pluginId: 'redis-app' });
  await expect(page).toHaveURL(/.*\/plugins\/redis-app$/);
});

test('should wait for plugin config settings API to respond', async ({ createAppConfigPage, page }) => {
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
