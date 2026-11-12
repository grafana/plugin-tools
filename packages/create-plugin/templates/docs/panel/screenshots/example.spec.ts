import { expect, test } from '@grafana/plugin-e2e';
import { captureDocsScreenshot } from './helpers';

// a pattern to copy, one spec per screenshot. Delete this file once the folder has real specs
test.skip('example: the panel on a provisioned dashboard', async ({ gotoDashboardPage, readProvisionedDashboard }) => {
  const dashboard = await readProvisionedDashboard({ fileName: 'dashboard.json' });
  const dashboardPage = await gotoDashboardPage(dashboard);
  const panel = dashboardPage.getPanelByTitle('Panel title');
  await expect(panel.locator).toBeVisible();

  await captureDocsScreenshot(panel.locator, 'example-panel');
});
