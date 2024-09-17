import * as semver from 'semver';
import { test, expect } from '../../../src';

test.describe('gotoDashboardPage', () => {
  test('should not display elements when waitUntil `load` is used', async ({
    gotoDashboardPage,
    readProvisionedDashboard,
  }) => {
    const dashboard = await readProvisionedDashboard({ fileName: 'redshift.json' });
    const dashboardPage = await gotoDashboardPage({ ...dashboard, waitUntil: 'load' });
    await expect(dashboardPage.getPanelByTitle('Basic table example').locator).toHaveCount(0);
  });

  test('should not display elements when waitUntil `networkidle` (default) is used', async ({
    gotoDashboardPage,
    readProvisionedDashboard,
  }) => {
    const dashboard = await readProvisionedDashboard({ fileName: 'redshift.json' });
    const dashboardPage = await gotoDashboardPage(dashboard);
    await expect(dashboardPage.getPanelByTitle('Basic table example').locator).toBeVisible();
  });
});

test.describe('gotoPanelEditPage', () => {
  test('should not display elements when waitUntil `load` is used', async ({
    gotoPanelEditPage,
    readProvisionedDashboard,
  }) => {
    const dashboard = await readProvisionedDashboard({ fileName: 'redshift.json' });
    const panelEditPage = await gotoPanelEditPage({ dashboard, id: '3', waitUntil: 'load' });
    await expect(panelEditPage.panel.locator).toHaveCount(0);
  });

  test('should not display elements when waitUntil `networkidle` (default) is used', async ({
    gotoPanelEditPage,
    readProvisionedDashboard,
  }) => {
    const dashboard = await readProvisionedDashboard({ fileName: 'redshift.json' });
    const panelEditPage = await gotoPanelEditPage({ dashboard, id: '3' });
    await expect(panelEditPage.panel.locator).toBeVisible();
  });
});
