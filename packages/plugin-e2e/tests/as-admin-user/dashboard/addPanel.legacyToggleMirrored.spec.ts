import * as semver from 'semver';
import { expect, test } from '../../../src';

test.use({ featureToggles: { dashboardNewLayouts: false } });

test('a legacy dashboardNewLayouts toggle turns the new layout off on 13.3+', async ({
  dashboardPage,
  grafanaVersion,
  page,
  selectors,
}) => {
  test.skip(semver.lt(grafanaVersion, '13.3.0'), 'dashboardNewLayouts is read through OpenFeature from Grafana 13.3');
  const { components, constants } = selectors;
  await expect(
    dashboardPage.getByGrafanaSelector(components.PageToolbar.itemButton(constants.PageToolBar.itemButtonTitle))
  ).toBeVisible();
  await expect(dashboardPage.getByGrafanaSelector(components.Sidebar.container)).toBeHidden();

  const panelEditPage = await dashboardPage.addPanel();
  await expect(panelEditPage.panel.locator).toBeVisible();
  expect(page.url()).toContain('editPanel');
});
