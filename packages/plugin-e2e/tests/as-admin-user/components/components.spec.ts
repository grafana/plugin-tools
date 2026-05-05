import * as semver from 'semver';
import { expect, test } from '../../../src';

test('components.dataSourcePicker should set the data source', async ({
  panelEditPage,
  components,
  readProvisionedDataSource,
}) => {
  const ds = await readProvisionedDataSource({ fileName: 'testdatasource.yaml' });
  await components.dataSourcePicker.set(ds.name);
  await expect(panelEditPage.getQueryEditorRow('A').getByRole('textbox', { name: 'Query Text' })).toBeVisible();
});

test('components.dataSourcePicker.within should set the data source when scoped to a root locator', async ({
  panelEditPage,
  components,
  readProvisionedDataSource,
  selectors,
}) => {
  const ds = await readProvisionedDataSource({ fileName: 'testdatasource.yaml' });
  const root = panelEditPage.getByGrafanaSelector(selectors.components.PanelEditor.General.content);
  await components.dataSourcePicker.within(root).set(ds.name);
  await expect(panelEditPage.getQueryEditorRow('A').getByRole('textbox', { name: 'Query Text' })).toBeVisible();
});

test('components.timeRangePicker should set the time range', async ({
  panelEditPage,
  components,
  selectors,
}) => {
  await components.timeRangePicker.set({ from: '2020-01-01 00:00:00', to: '2020-01-02 00:00:00' });
  // older Grafana versions render the time picker twice, so we use .first() to avoid strict mode violations
  const openButton = panelEditPage.getByGrafanaSelector(selectors.components.TimePicker.openButton).first();
  await expect(openButton).toContainText('2020-01-01 00:00:00');
});

test('components.timeRangePicker.within should set the time range when scoped to a root locator', async ({
  gotoDashboardPage,
  readProvisionedDashboard,
  components,
  selectors,
  grafanaVersion,
}) => {
  const dashboard = await readProvisionedDashboard({ fileName: 'testdatasource.json' });
  const dashboardPage = await gotoDashboardPage(dashboard);
  // NavToolbar.container was introduced in Grafana 9.4.0; use the legacy PageToolbar for older versions
  const root = semver.gte(grafanaVersion, '9.4.0')
    ? dashboardPage.getByGrafanaSelector(selectors.components.NavToolbar.container)
    : dashboardPage.getByGrafanaSelector(selectors.components.PageToolbar.container);
  await components.timeRangePicker.within(root).set({ from: '2020-01-01 00:00:00', to: '2020-01-02 00:00:00' });
  const openButton = dashboardPage.getByGrafanaSelector(selectors.components.TimePicker.openButton).first();
  await expect(openButton).toContainText('2020-01-01 00:00:00');
});
