import { expect, test } from '../../../../src';

test('add panel in already existing dashboard', async ({ gotoDashboardPage, readProvisionedDashboard, page }) => {
  const dashboard = await readProvisionedDashboard({ fileName: 'testdatasource.json' });
  const dashboardPage = await gotoDashboardPage(dashboard);
  await dashboardPage.addPanel();
  await expect(page.url()).toContain('editPanel');
});

test('add panel in new dashboard', async ({ dashboardPage, page }) => {
  const panelEditPage = await dashboardPage.addPanel();
  await expect(panelEditPage.panel.locator).toBeVisible();
  await expect(page.url()).toContain('editPanel');
});
