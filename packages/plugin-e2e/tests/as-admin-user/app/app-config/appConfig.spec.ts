import { expect, test } from '../../../../src';

test('should navigate to app config page for provided plugin id when created', async ({ gotoAppConfigPage, page }) => {
  await gotoAppConfigPage({ pluginId: 'redis-app' });
  await expect(page).toHaveURL(/.*\/plugins\/redis-app$/);
});

test('should wait for plugin config settings API to respond', async ({ gotoAppConfigPage, page }) => {
  const configPage = await gotoAppConfigPage({ pluginId: 'redis-app' });
  // only intercept the settings save (POST) so we don't mutate server state. the GET that
  // fetches plugin meta - and renders the enable/disable button - must reach the real backend,
  // otherwise the button never renders. since Grafana 13.1.0 the meta GET fires after navigation
  // completes, so a method-agnostic mock would swallow it and leave the button missing.
  await page.route('/api/plugins/redis-app/settings', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({ status: 200 });
    } else {
      await route.fallback();
    }
  });

  // wait for the enable/disable button to render (meta GET resolved) before listening for the
  // save response, so we capture the POST triggered by the click and not the meta GET
  const enableDisableButton = page.getByRole('button', { name: /Disable|Enable/i }).first();
  await enableDisableButton.waitFor({ state: 'visible' });

  const response = configPage.waitForSettingsResponse();
  await enableDisableButton.click();
  await expect(response).toBeOK();
});
