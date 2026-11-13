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
 * The popover is on Grafana main but not yet in a release. This is a runtime check rather than a version check because
 * nightly builds report pre-release versions (e.g. 13.4.0-<build>), which sort below the release that ships the
 * popover, so a version check would skip the nightly builds that have it.
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
