import { expect, test } from '@grafana/plugin-e2e';
import { captureDocsScreenshot } from './helpers';

// a pattern to copy, one spec per screenshot. Delete this file once the folder has real specs
test.skip('example: the config editor with placeholder values', async ({ createDataSourceConfigPage, page }) => {
  await createDataSourceConfigPage({ type: '{{pluginId}}' });
  // type placeholders only. The screenshot is published
  await page.getByLabel('API key').fill('<API_KEY>');
  await expect(page.getByLabel('API key')).toHaveValue('<API_KEY>');

  await captureDocsScreenshot(page, 'example-config-editor');
});
