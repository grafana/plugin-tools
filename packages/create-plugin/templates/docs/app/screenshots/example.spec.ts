import { expect, test } from '@grafana/plugin-e2e';
import { captureDocsScreenshot } from './helpers';

// a pattern to copy, one spec per screenshot. Delete this file once the folder has real specs
test.skip('example: the app root page', async ({ gotoAppPage, page }) => {
  await gotoAppPage({ pluginId: '{{pluginId}}' });
  await expect(page.getByRole('main')).toBeVisible();

  await captureDocsScreenshot(page.getByRole('main'), 'example-app-page');
});
