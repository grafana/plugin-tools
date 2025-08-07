import { test, expect } from '../../../src';

test.describe('gotoDashboardPage', () => {
  test('should display elements when waitUntil `load` (default) is used', async ({
    gotoDashboardPage,
    readProvisionedDashboard,
  }) => {
    const dashboard = await readProvisionedDashboard({ fileName: 'testdatasource.json' });
    const dashboardPage = await gotoDashboardPage({ ...dashboard });
    await expect(dashboardPage.getPanelByTitle('Table data').locator).toBeVisible();
  });
});

test.describe('gotoPanelEditPage', () => {
  test('should display elements when waitUntil `load` (default) is used', async ({
    gotoPanelEditPage,
    readProvisionedDashboard,
  }) => {
    const dashboard = await readProvisionedDashboard({ fileName: 'testdatasource.json' });
    const panelEditPage = await gotoPanelEditPage({ dashboard, id: '3' });
    await expect(panelEditPage.panel.locator).toBeVisible();
  });
});
