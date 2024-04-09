import { test, expect } from '../../../src';

test('click on menu item', async ({ readProvisionedDashboard, gotoDashboardPage, page }) => {
  const dashboard = await readProvisionedDashboard({ fileName: 'redshift.json' });
  const dashboardPage = await gotoDashboardPage(dashboard);
  const panel = await dashboardPage.getPanelByTitle('Basic table example');
  await panel.clickOnMenuItem('Edit');
  await expect(page).toHaveURL(/.*editPanel=.*/);
});

test('click on sub menu item', async ({ readProvisionedDashboard, gotoDashboardPage, page, selectors }) => {
  const dashboard = await readProvisionedDashboard({ fileName: 'redshift.json' });
  const dashboardPage = await gotoDashboardPage(dashboard);
  const panel = await dashboardPage.getPanelByTitle('Basic table example');
  await panel.clickOnMenuItem('Query', { parentItem: 'Inspect' });
  await expect(
    dashboardPage.getByGrafanaSelector(selectors.components.Drawer.General.title(''), { startsWith: true })
  ).toBeVisible();
});
