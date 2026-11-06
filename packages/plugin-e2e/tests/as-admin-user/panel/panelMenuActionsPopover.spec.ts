import { lt } from 'semver';
import { test, expect, DashboardPage, Panel, E2ESelectorGroups } from '../../../src';

test.use({
  openFeature: {
    flags: {
      'grafana.panelActionsPopover': true,
    },
  },
});

/**
 * Skips the test unless the panel actions popover replaced the panel header menu button.
 *
 * TODO: the popover is added by https://github.com/grafana/grafana/pull/135057, which isn't merged yet.
 * Once it is released, replace this runtime check with a version check on the first Grafana release that contains it,
 * e.g. test.skip(lt(grafanaVersion, '13.3.0'), ...) if it ships in 13.3.0.
 */
async function skipWithoutActionsPopover(dashboardPage: DashboardPage, panel: Panel, selectors: E2ESelectorGroups) {
  await expect(panel.locator).toBeVisible();
  const panelMenu = dashboardPage.getByGrafanaSelector(selectors.components.Panels.Panel.menu(''), {
    startsWith: true,
    root: panel.locator,
  });
  test.skip((await panelMenu.count()) > 0, 'This Grafana build has no panel actions popover');
}

test.beforeEach(({ grafanaVersion }) => {
  test.skip(lt(grafanaVersion, '12.1.0'), 'OpenFeature OFREP was introduced in Grafana 12.1.0');
});

test('click on menu item that moved to the panel actions popover', async ({
  readProvisionedDashboard,
  gotoDashboardPage,
  page,
  selectors,
}) => {
  const dashboard = await readProvisionedDashboard({ fileName: 'testdatasource.json' });
  const dashboardPage = await gotoDashboardPage(dashboard);
  const panel = dashboardPage.getPanelByTitle('Table data');
  await skipWithoutActionsPopover(dashboardPage, panel, selectors);

  await panel.clickOnMenuItem('Edit');
  await expect(page).toHaveURL(/.*editPanel=.*/);
});

test('click on sub menu item in the panel actions popover menu', async ({
  readProvisionedDashboard,
  gotoDashboardPage,
  selectors,
}) => {
  const dashboard = await readProvisionedDashboard({ fileName: 'testdatasource.json' });
  const dashboardPage = await gotoDashboardPage(dashboard);
  const panel = dashboardPage.getPanelByTitle('Table data');
  await skipWithoutActionsPopover(dashboardPage, panel, selectors);

  await panel.clickOnMenuItem('Query', { parentItem: 'Inspect' });
  await expect(
    dashboardPage.getByGrafanaSelector(selectors.components.Drawer.General.title(''), { startsWith: true })
  ).toBeVisible();
});

test('click on menu item in the panel actions popover menu', async ({
  readProvisionedDashboard,
  gotoDashboardPage,
  page,
  selectors,
}) => {
  const dashboard = await readProvisionedDashboard({ fileName: 'testdatasource.json' });
  const dashboardPage = await gotoDashboardPage(dashboard);
  const panel = dashboardPage.getPanelByTitle('Table data');
  await skipWithoutActionsPopover(dashboardPage, panel, selectors);

  await panel.clickOnMenuItem('Inspect');
  await expect(page).toHaveURL(/.*inspect=.*/);
  await expect(
    dashboardPage.getByGrafanaSelector(selectors.components.Drawer.General.title(''), { startsWith: true })
  ).toBeVisible();
});
